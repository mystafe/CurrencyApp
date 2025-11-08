import React from "react";
import { useTranslation } from 'react-i18next';
import { motion } from "framer-motion";

function Navbar({ theme, toggleTheme, toggleLanguage, superMode, clearCache, checkUsage, setAccent, accent }) {
  const { i18n } = useTranslation();

  const iconProps = {
    whileHover: { scale: 1.1 },
    whileTap: { scale: 0.9 }
  };

  return (
    <nav className="topNav" aria-label="main navigation">
      <div className="brand" aria-label="brand">
        <span className="brandTitle">CurrencyApp</span>
      </div>
      <div className="navActions">
        <>
          <div className="accentSwatches" aria-label="accent colors">
            {[
              { key: 'purple', color: '#6c5ce7', label: 'Purple' },
              { key: 'teal', color: '#0fae96', label: 'Teal' },
              { key: 'amber', color: '#f59e0b', label: 'Amber' },
            ].map(({ key, color, label }) => (
              <motion.button
                key={key}
                aria-label={`Set accent ${label}`}
                className="accentSwatch"
                style={{ backgroundColor: color, outline: accent === key ? '2px solid #fff' : 'none' }}
                onClick={() => setAccent && setAccent(key)}
                {...iconProps}
              />
            ))}
          </div>
          <motion.button
            className="themeToggle"
            aria-label="Toggle theme"
            onClick={toggleTheme}
            {...iconProps}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </motion.button>
          <motion.button
            className="langToggle"
            aria-label="Toggle language"
            onClick={toggleLanguage}
            {...iconProps}
          >
            {i18n.language === 'tr' ? '🇬🇧' : '🇹🇷'}
          </motion.button>
          {superMode && (
            <>
              <motion.button
                className="cacheClear"
                aria-label="Clear cache"
                onClick={clearCache}
                {...iconProps}
              >
                🗑️
              </motion.button>
              <motion.button
                className="usageCheck"
                aria-label="Check usage"
                onClick={checkUsage}
                {...iconProps}
              >
                📈
              </motion.button>
            </>
          )}
        </>
      </div>
    </nav>
  );
}

export default Navbar;
