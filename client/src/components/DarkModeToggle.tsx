import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export const DarkModeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('teamspace-theme');
    return stored ? stored === 'dark' : true; // default dark
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      localStorage.setItem('teamspace-theme', 'dark');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      localStorage.setItem('teamspace-theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(d => !d)}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width: '34px',
        height: '34px',
        borderRadius: '8px',
        border: '1px solid var(--border-subtle)',
        background: 'rgba(255,255,255,0.05)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        transition: 'all 0.2s',
      }}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
};
