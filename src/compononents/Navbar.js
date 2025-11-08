import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import { motion } from "framer-motion";

function Navbar({ theme, toggleTheme, toggleLanguage, superMode, clearCache, checkUsage, setAccent, accent, setAppId, styleTheme, setStyleTheme }) {
  const { i18n } = useTranslation();

  const iconProps = {
    whileHover: { scale: 1.1 },
    whileTap: { scale: 0.9 }
  };

  const [isCompact, setIsCompact] = useState(window.innerWidth <= 576);
  const [showMenu, setShowMenu] = useState(false);
  const [keyPresent, setKeyPresent] = useState(Boolean((localStorage.getItem('oer.appId') || '').trim() || process.env.REACT_APP_APP_ID));
  const menuBtnRef = useRef(null);
  const sheetRef = useRef(null);
  useEffect(() => {
    const onResize = () => setIsCompact(window.innerWidth <= 576);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  useEffect(() => {
    const onClick = (e) => {
      if (!showMenu) return;
      const target = e.target;
      if (menuBtnRef.current && menuBtnRef.current.contains(target)) return;
      if (sheetRef.current && sheetRef.current.contains(target)) return;
      setShowMenu(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setShowMenu(false);
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [showMenu]);

  const actions = (
    <div className="menuColumn">
      <div className="menuGroup">
        <span className="menuTitle">Style</span>
        <div className="styleRow">
          {['default','metal','glass','wood'].map((s) => (
            <motion.button
              key={s}
              className={`styleChip${styleTheme === s ? ' active' : ''}`}
              onClick={() => setStyleTheme && setStyleTheme(s)}
              {...iconProps}
            >
              {s}
            </motion.button>
          ))}
        </div>
      </div>
      <div className="menuGroup">
        <span className="menuTitle">Accent</span>
        <div className="accentSwatches" aria-label="accent colors">
          {[
            { key: 'purple', color: '#6c5ce7', label: 'Purple' },
            { key: 'teal', color: '#0fae96', label: 'Teal' },
            { key: 'amber', color: '#f59e0b', label: 'Amber' },
          ].map(({ key, color, label }) => (
            <motion.button
              key={key}
              aria-label={`Set accent ${label}`}
              title={`Accent: ${label}`}
              className="accentSwatch"
              style={{ backgroundColor: color, outline: accent === key ? '2px solid #fff' : 'none' }}
              onClick={() => setAccent && setAccent(key)}
              {...iconProps}
            />
          ))}
        </div>
      </div>
      <div className="menuGroup">
        <span className="menuTitle">App</span>
        <div className="menuRow">
          <motion.button
            className="apiKey menuItem"
            aria-label="Set API key"
            title="Set API key"
            onClick={() => {
              if (setAppId) setAppId();
              setTimeout(() => {
                setKeyPresent(Boolean((localStorage.getItem('oer.appId') || '').trim() || process.env.REACT_APP_APP_ID));
              }, 50);
            }}
            {...iconProps}
          >
            {keyPresent ? '🔒' : '🔑'}
          </motion.button>
          <motion.button
            className="themeToggle menuItem"
            aria-label="Toggle theme"
            title="Toggle theme"
            onClick={toggleTheme}
            {...iconProps}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </motion.button>
          <motion.button
            className="langToggle menuItem"
            aria-label="Toggle language"
            title="Toggle language"
            onClick={toggleLanguage}
            {...iconProps}
          >
            {i18n.language === 'tr' ? '🇬🇧' : '🇹🇷'}
          </motion.button>
          {superMode && (
            <>
              <motion.button
                className="cacheClear menuItem"
                aria-label="Clear cache"
                onClick={clearCache}
                {...iconProps}
              >
                🗑️
              </motion.button>
              <motion.button
                className="usageCheck menuItem"
                aria-label="Check usage"
                onClick={checkUsage}
                {...iconProps}
              >
                📈
              </motion.button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <nav className="topNav" aria-label="main navigation">
      <div className="navActions">
        {isCompact ? (
          <>
            <motion.button
              className="moreToggle"
              aria-label="More"
              title="More"
              aria-expanded={showMenu ? 'true' : 'false'}
              ref={menuBtnRef}
              onClick={() => setShowMenu((s) => !s)}
              {...iconProps}
            >
              ⋯
            </motion.button>
            {showMenu && <div className="navSheet" ref={sheetRef}>{actions}</div>}
          </>
        ) : (
          actions
        )}
      </div>
    </nav>
  );
}

export default Navbar;
