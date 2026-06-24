const pool = require('./database');

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const CURRENCIES = ['BTC','ETH','USDT','BNB','SOL','XRP','ADA','DOGE','TRX','LTC','MATIC','AVAX','LINK','DOT','SHIB'];
    const balanceCols = CURRENCIES.map(c => `${c.toLowerCase()}_balance DECIMAL(20, 8) DEFAULT 0`).join(',\n        ');
    const currencyCheck = CURRENCIES.map(c => `'${c}'`).join(', ');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        is_verified BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        ${balanceCols},
        avatar_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Add missing balance columns for existing tables
    for (const c of CURRENCIES) {
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS ${c.toLowerCase()}_balance DECIMAL(20, 8) DEFAULT 0
      `);
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS email_verifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        otp VARCHAR(6),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS wallet_addresses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        currency VARCHAR(10) NOT NULL,
        address VARCHAR(255) NOT NULL,
        label VARCHAR(100),
        network VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS deposits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        currency VARCHAR(10) NOT NULL,
        amount DECIMAL(20, 8) NOT NULL,
        txid VARCHAR(255) NOT NULL,
        wallet_address_id UUID REFERENCES wallet_addresses(id),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        admin_note TEXT,
        reviewed_by UUID REFERENCES users(id),
        reviewed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        currency VARCHAR(10) NOT NULL,
        amount DECIMAL(20, 8) NOT NULL,
        destination_address VARCHAR(255) NOT NULL,
        network VARCHAR(50),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processing')),
        admin_note TEXT,
        txid VARCHAR(255),
        reviewed_by UUID REFERENCES users(id),
        reviewed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(30) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'credit', 'debit')),
        currency VARCHAR(10) NOT NULL,
        amount DECIMAL(20, 8) NOT NULL,
        balance_before DECIMAL(20, 8),
        balance_after DECIMAL(20, 8),
        reference_id UUID,
        reference_type VARCHAR(20),
        description TEXT,
        status VARCHAR(20) DEFAULT 'completed',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(30) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
        is_read BOOLEAN DEFAULT FALSE,
        action_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`);

    // Default admin
    const bcrypt = require('bcryptjs');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@cryptovault.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Emma@1103';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    await client.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, is_verified)
      VALUES ($1, $2, 'Admin', 'User', 'admin', true)
      ON CONFLICT (email) DO NOTHING
    `, [adminEmail, hashedPassword]);

    // Default wallet addresses for all currencies
    const defaultAddresses = [
      ['BTC','1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf','Main BTC Wallet','Bitcoin'],
      ['ETH','0x742d35Cc6634C0532925a3b8D4C9b7F9c4b5e123','Main ETH Wallet','Ethereum'],
      ['USDT','TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE','Main USDT Wallet','TRC20'],
      ['BNB','bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2','Main BNB Wallet','BEP2'],
      ['SOL','So11111111111111111111111111111111111111112','Main SOL Wallet','Solana'],
      ['XRP','rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh','Main XRP Wallet','XRP Ledger'],
      ['ADA','addr1qx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2ytjqp','Main ADA Wallet','Cardano'],
      ['DOGE','DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L','Main DOGE Wallet','Dogecoin'],
      ['TRX','TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSF','Main TRX Wallet','TRON'],
      ['LTC','LYjmZ1s6RgvDFhvHJMqhJBCJN5j3ybUAhM','Main LTC Wallet','Litecoin'],
      ['MATIC','0x742d35Cc6634C0532925a3b8D4C9b7F9c4b5e124','Main MATIC Wallet','Polygon'],
      ['AVAX','X-avax1tzdcgj4ehsvhhgpl7zylwpwdqsl0nq7kzgtvjy','Main AVAX Wallet','Avalanche'],
      ['LINK','0x742d35Cc6634C0532925a3b8D4C9b7F9c4b5e125','Main LINK Wallet','Ethereum'],
      ['DOT','1FRMM8PEiWXYax7rpS6X4XZX1aAAxSWx1CrKTyrVYhV16n','Main DOT Wallet','Polkadot'],
      ['SHIB','0x742d35Cc6634C0532925a3b8D4C9b7F9c4b5e126','Main SHIB Wallet','Ethereum'],
    ];

    for (const [currency, address, label, network] of defaultAddresses) {
      await client.query(`
        INSERT INTO wallet_addresses (currency, address, label, network)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING
      `, [currency, address, label, network]);
    }

    await client.query('COMMIT');
    console.log('✅ Database migration completed successfully');
    console.log(`📧 Admin email: ${adminEmail}`);
    console.log(`🔑 Admin password: ${adminPassword}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    pool.end();
  }
};

migrate().catch(console.error);
