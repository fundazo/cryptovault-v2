# Deployment Guide

## Frontend Only (Netlify / Vercel — FREE)

### Netlify
1. Run: `cd frontend && npm run build`
2. Drag the `frontend/build` folder to https://app.netlify.com/drop
3. Set environment variable: `REACT_APP_API_URL=https://your-backend-url.com/api/v1`

### Vercel
1. Push project to GitHub
2. Go to https://vercel.com → Import repo
3. Set root to `frontend`
4. Add env: `REACT_APP_API_URL=https://your-backend-url.com/api/v1`

---

## Backend (Railway — FREE tier)

1. Go to https://railway.app → New Project → Deploy from GitHub
2. Select your repo → set root directory to `backend`
3. Add environment variables (copy from your .env file)
4. Railway auto-detects Node.js and deploys

Your backend URL will be something like: `https://cryptovault-backend.up.railway.app`

---

## Backend (Render — FREE tier)

1. Go to https://render.com → New Web Service
2. Connect your GitHub repo, set root to `backend`
3. Build command: `npm install`
4. Start command: `node src/server.js`
5. Add all .env variables in the Environment tab

---

## Run migration after deploying backend

In Railway/Render console or locally:
```bash
cd backend
node src/config/migrate.js
```

---

## Local development (simplest)

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend  
cd frontend && npm start
```

Frontend: http://localhost:3000
Backend:  http://localhost:5000
Admin:    admin@cryptovault.com / Admin@123456
