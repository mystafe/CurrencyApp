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
  const [styleTheme, setStyleTheme] = useState(() => localStorage.getItem('ui.style') || 'default');
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

  const promptSetAppId = () => {
    const current = localStorage.getItem('oer.appId') || '';
    const next = window.prompt('OpenExchangeRates App ID', current) || '';
    if (next && next !== current) {
      try {
        localStorage.setItem('oer.appId', next.trim());
        showToast('API key saved', 'success');
      } catch {
        showToast('Failed to save API key', 'error');
      }
    }
  };

  const getOerAppId = () => {
    const fromLocal = localStorage.getItem('oer.appId');
    return (fromLocal && fromLocal.trim()) || process.env.REACT_APP_APP_ID;
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
      const appId = getOerAppId();
      if (!appId) {
        showToast('Missing API key. Tap 🔑 to set it.', 'error');
        return;
      }
      const resp = await fetch(
        `https://openexchangerates.org/api/usage.json?app_id=${appId}&prettyprint=true`
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
    ['style-default','style-metal','style-glass','style-wood'].forEach((c) => document.body.classList.remove(c));
    document.body.classList.add(`style-${styleTheme}`);
    try { localStorage.setItem('ui.style', styleTheme); } catch {}
  }, [styleTheme]);

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
    const handler = (e) => {
      e.preventDefault();
      showToast('Add CurrencyApp to your home screen from your browser menu', 'info', 4000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const onboarded = localStorage.getItem('ui.onboarded');
    if (!onboarded) {
      showToast('Tip: Open the menu (⋯) to change theme and styles', 'info', 4000);
      try { localStorage.setItem('ui.onboarded', '1'); } catch {}
    }
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
        setAppId={promptSetAppId}
        styleTheme={styleTheme}
        setStyleTheme={setStyleTheme}
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
