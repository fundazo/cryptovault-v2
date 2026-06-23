import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem('theme') !== 'light'; } catch { return true; }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('light');
      root.classList.add('dark');
      document.body.style.background = '#080b14';
      document.body.style.color = '#e2e8f0';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      document.body.style.background = '#f0f4ff';
      document.body.style.color = '#0f172a';
    }
    try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch {}
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme: () => setIsDark(d => !d) }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
