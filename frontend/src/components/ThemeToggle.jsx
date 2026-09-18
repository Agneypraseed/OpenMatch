import { useState } from 'react';

function initialTheme() {
  return document.documentElement.dataset.theme || 'light';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(initialTheme);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('openmatch-theme', next); } catch { /* Theme works even when storage is unavailable. */ }
    setTheme(next);
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <span className="theme-toggle__track" aria-hidden="true">
        <span className="theme-toggle__thumb">
          {theme === 'dark' ? '☾' : '☀'}
        </span>
      </span>
    </button>
  );
}
