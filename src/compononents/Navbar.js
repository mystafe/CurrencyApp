import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from "framer-motion";

function Navbar({ theme, toggleTheme, toggleLanguage, superMode, clearCache, checkUsage, setAccent, accent, setAppId, styleTheme, setStyleTheme }) {
  const { i18n } = useTranslation();

  const iconProps = {
    whileHover: { scale: 1.1 },
    whileTap: { scale: 0.9 }
  };

  const [isCompact, setIsCompact] = useState(window.innerWidth <= 576); // reserved for future layout changes
  const [showMenu, setShowMenu] = useState(false);
  const [keyPresent, setKeyPresent] = useState(Boolean((localStorage.getItem('oer.appId') || '').trim() || process.env.REACT_APP_APP_ID));
  const menuBtnRef = useRef(null);
  const sheetRef = useRef(null);
  const menuId = 'topnav-menu';
  // No longer switching layouts; keep for future if needed
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

  const focusNext = (dir) => {
    if (!sheetRef.current) return;
    const focusables = Array.from(sheetRef.current.querySelectorAll('button, [role="menuitemradio"]'));
    if (!focusables.length) return;
    const idx = focusables.indexOf(document.activeElement);
    const nextIdx = idx < 0 ? 0 : (idx + dir + focusables.length) % focusables.length;
    focusables[nextIdx].focus();
  };

  const onMenuKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      focusNext(1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      focusNext(-1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusNext(9999); // wrap to first after modulo
    } else if (e.key === 'End') {
      e.preventDefault();
      focusNext(-9999); // wrap to last after modulo
    }
  };

  useEffect(() => {
    const onKbd = (e) => {
      if (e.altKey && (e.key.toLowerCase() === 'm')) {
        e.preventDefault();
        setShowMenu((s) => !s);
      }
    };
    window.addEventListener('keydown', onKbd);
    return () => window.removeEventListener('keydown', onKbd);
  }, []);

  const actions = (
    <div className="menuColumn">
      <div className="menuGroup">
        <span className="menuTitle">Style</span>
        <div className="styleRow">
          {['default','metal','glass','wood'].map((s) => (
            <motion.button
              key={s}
              className={`styleChip${styleTheme === s ? ' active' : ''}`}
              role="menuitemradio"
              aria-checked={styleTheme === s ? 'true' : 'false'}
              title={s}
              onClick={() => setStyleTheme && setStyleTheme(s)}
              {...iconProps}
            >
              {s === 'default' ? '✨' : s === 'metal' ? '⚙️' : s === 'glass' ? '🪟' : '🪵'}
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
              role="menuitemradio"
              aria-checked={accent === key ? 'true' : 'false'}
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
            {keyPresent ? '🔒 API' : '🔑 API'}
          </motion.button>
          <motion.button
            className="themeToggle menuItem"
            aria-label="Toggle theme"
            title="Toggle theme"
            onClick={toggleTheme}
            {...iconProps}
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </motion.button>
          <motion.button
            className="langToggle menuItem"
            aria-label="Toggle language"
            title="Toggle language"
            onClick={toggleLanguage}
            {...iconProps}
          >
            {i18n.language === 'tr' ? '🇬🇧 EN' : '🇹🇷 TR'}
          </motion.button>
          {superMode && (
            <>
              <motion.button
                className="cacheClear menuItem"
                aria-label="Clear cache"
                onClick={clearCache}
                {...iconProps}
              >
                🗑️ Cache
              </motion.button>
              <motion.button
                className="usageCheck menuItem"
                aria-label="Check usage"
                onClick={checkUsage}
                {...iconProps}
              >
                📈 Usage
              </motion.button>
            </>
          )}
        </div>
      </div>
      <div className="menuGroup">
        <span className="menuTitle">Shortcuts</span>
        <div className="menuHint">
          t: Today · x: Clear Compare · Alt+Arrows: Month · Shift+Alt+Arrows: Year · Ctrl+Arrows: Compare
        </div>
      </div>
    </div>
  );

  return (
    <nav className="topNav" aria-label="main navigation">
      <div className="navActions">
        <div className="quickActions" aria-label="quick actions">
          <motion.button
            className="themeToggle"
            aria-label="Toggle theme"
            title="Toggle theme"
            onClick={toggleTheme}
            {...iconProps}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </motion.button>
          <motion.button
            className="langToggle"
            aria-label="Toggle language"
            title="Toggle language"
            onClick={toggleLanguage}
            {...iconProps}
          >
            {i18n.language === 'tr' ? '🇬🇧' : '🇹🇷'}
          </motion.button>
        </div>
        <>
          <motion.button
            className="moreToggle"
            aria-label="More"
            title="More"
            aria-expanded={showMenu ? 'true' : 'false'}
            aria-haspopup="menu"
            aria-controls={menuId}
            ref={menuBtnRef}
            onClick={() => setShowMenu((s) => !s)}
            {...iconProps}
          >
            ⋯
          </motion.button>
          <AnimatePresence>
            {showMenu && (
              <motion.div
                className="navSheet"
                id={menuId}
                ref={sheetRef}
                role="menu"
                onKeyDown={onMenuKeyDown}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.14, ease: 'easeOut' }}
              >
                {actions}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      </div>
    </nav>
  );
}

export default Navbar;
