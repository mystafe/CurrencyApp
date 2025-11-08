import "./App.css";
import Currency from "./compononents/Currency";
import Footer from "./compononents/Footer";
import Navbar from "./compononents/Navbar";

import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';

function App() {
  const { i18n } = useTranslation();
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('ui.theme');
    return saved || (prefersDark ? "dark" : "light");
  });
  const [accent, setAccent] = useState(() => localStorage.getItem('ui.accent') || 'purple');
  const [superMode, setSuperMode] = useState(false);
  const [, setTitleClicks] = useState(0);
  const [toasts, setToasts] = useState([]);

  const toggleLanguage = () => {
    const newLng = i18n.language === 'tr' ? 'en' : 'tr';
    i18n.changeLanguage(newLng);
    try { localStorage.setItem('ui.lang', newLng); } catch {}
  };

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try { localStorage.setItem('ui.theme', next); } catch {}
      return next;
    });
  };

  const showToast = (message, type = 'info', durationMs = 3000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, durationMs);
  };

  const handleTitleClick = () => {
    setTitleClicks((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        setSuperMode((s) => !s);
        return 0;
      }
      return next;
    });
  };

  const clearCache = () => {
    localStorage.clear();
    showToast('Cache cleared', 'success');
    window.location.reload();
  };

  const checkUsage = async () => {
    try {
      const resp = await fetch(
        `https://openexchangerates.org/api/usage.json?app_id=${process.env.REACT_APP_APP_ID}&prettyprint=true`
      );
      if (!resp.ok) throw new Error('Request failed');
      const data = await resp.json();
      const usage = data.usage || data.data?.usage;
      if (!usage) throw new Error('Malformed response');
      showToast(`Remaining requests: ${usage.requests_remaining}`, 'info', 3500);
    } catch {
      showToast('Failed to fetch usage info', 'error');
    }
  };

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  useEffect(() => {
    document.body.classList.remove('accent-purple', 'accent-teal', 'accent-amber');
    document.body.classList.add(`accent-${accent}`);
    try { localStorage.setItem('ui.accent', accent); } catch {}
  }, [accent]);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 4) {
        document.body.classList.add('scrolled');
      } else {
        document.body.classList.remove('scrolled');
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const savedLang = localStorage.getItem('ui.lang');
    if (savedLang && savedLang !== i18n.language) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  return (
    <div className="container">
      <Navbar
        theme={theme}
        toggleTheme={toggleTheme}
        toggleLanguage={toggleLanguage}
        superMode={superMode}
        clearCache={clearCache}
        checkUsage={checkUsage}
        setAccent={setAccent}
        accent={accent}
      />
      <Currency isSuper={superMode} onTitleClick={handleTitleClick} notify={showToast} />
      <div className="toastContainer" aria-live="polite" aria-atomic="true">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
}

export default App;
