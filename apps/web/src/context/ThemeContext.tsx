import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'terminal' | 'midnight' | 'light' | 'emerald';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'marketeye_theme_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to Bloomberg / OLED Jet Black & Amber Gold terminal theme as chosen
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'terminal' || saved === 'midnight' || saved === 'light' || saved === 'emerald') {
        return saved;
      }
    } catch (e) {
      console.warn('Unable to read theme from localStorage', e);
    }
    return 'terminal';
  });

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (e) {
      console.warn('Unable to persist theme to localStorage', e);
    }
  };

  const toggleTheme = () => {
    const sequence: ThemeMode[] = ['terminal', 'midnight', 'light', 'emerald'];
    const nextIndex = (sequence.indexOf(theme) + 1) % sequence.length;
    setTheme(sequence[nextIndex]);
  };

  useEffect(() => {
    const root = document.documentElement;
    // Remove previous theme class names
    root.classList.remove('theme-terminal', 'theme-midnight', 'theme-light', 'theme-emerald', 'dark', 'light');

    // Add current theme class
    root.classList.add(`theme-${theme}`);
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.add('dark');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
