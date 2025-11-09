/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef } from "react";
import { Form, Button } from "react-bootstrap";
import { useTranslation } from 'react-i18next';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { AnimatePresence, motion } from "framer-motion";
import allCurrencyCodes from "../currencyCodes";

const currencySymbols = {
  AUD: "A$",
  BGN: "лв",
  BRL: "R$",
  CAD: "C$",
  CHF: "CHF",
  CNY: "¥",
  CZK: "Kč",
  DKK: "kr",
  EUR: "€",
  GBP: "£",
  HKD: "HK$",
  HUF: "Ft",
  IDR: "Rp",
  ILS: "₪",
  INR: "₹",
  ISK: "kr",
  JPY: "¥",
  KRW: "₩",
  MXN: "MX$",
  MYR: "RM",
  NOK: "kr",
  NZD: "NZ$",
  PHP: "₱",
  PLN: "zł",
  RON: "lei",
  SEK: "kr",
  SGD: "S$",
  THB: "฿",
  TRY: "₺",
  USD: "$",
  ZAR: "R",
  AED: "DH",
  SAR: "SAR",
  BTC: "₿",
  XPT: "Platinum (g)",
  XPD: "Palladium (g)",
};

const currencyFlags = {
  XAU: "\uD83E\uDD47", // gold medal
  XAG: "\uD83E\uDD48", // silver medal
  XPT: "\uD83E\uDE99", // coin
  XPD: "\u2699\uFE0F", // gear
  BTC: "\u20BF", // bitcoin
};

const countryCodeToFlag = (countryCode) =>
  countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));

const getFlag = (code) => {
  if (!code) return "";
  if (currencyFlags[code]) return currencyFlags[code];
  if (code.startsWith("X")) return "";
  return countryCodeToFlag(code.slice(0, 2));
};

// (number formatting now handled inline where needed)

const favoriteCodes = [
  "AED",
  "TRY",
  "USD",
  "EUR",
  "XAU",
  "XAG",
  "BTC",
  "RUB",
  "ARS",
  "CAD",
  "AZN",
  "CNY",
  "GEL",
  "IDR",
  "IQD",
  "INR",
  "IRR",
  "KRW",
  "KZT",
  "SEK",
  "SYP",
  "THB",
  "UAH",
];

const orderedCodes = [
  ...favoriteCodes,
  ...allCurrencyCodes.filter((c) => !favoriteCodes.includes(c)),
];

const frankfurterCodes = [
  "AUD",
  "BGN",
  "BRL",
  "CAD",
  "CHF",
  "CNY",
  "CZK",
  "DKK",
  "EUR",
  "GBP",
  "HKD",
  "HUF",
  "IDR",
  "ILS",
  "INR",
  "ISK",
  "JPY",
  "KRW",
  "MXN",
  "MYR",
  "NOK",
  "NZD",
  "PHP",
  "PLN",
  "RON",
  "SEK",
  "SGD",
  "THB",
  "TRY",
  "USD",
  "ZAR",
];

const METAL_CODES = ["XAU", "XAG", "XPT", "XPD"];

const getOerAppId = () => {
  const fromLocal = localStorage.getItem('oer.appId');
  return (fromLocal && fromLocal.trim()) || process.env.REACT_APP_APP_ID;
};

const TROY_OUNCE_TO_GRAM = 31.1034768;
// Convert metal prices from USD per troy ounce to USD per gram

const fetchOpenRates = async (date) => {
  const OER_APP_ID = getOerAppId();
  if (!OER_APP_ID) {
    throw new Error("Missing OpenExchangeRates App ID");
  }
  const key = `oer_${date}`;
  const cached = localStorage.getItem(key);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      localStorage.removeItem(key);
    }
  }
  const resp = await fetch(
    `https://openexchangerates.org/api/historical/${date}.json?app_id=${OER_APP_ID}&show_metals=1`
  );
  if (!resp.ok) throw new Error("Request failed!");
  const data = await resp.json();
  const rates = data.rates;
  METAL_CODES.forEach((m) => {
    if (rates[m] != null) rates[m] *= TROY_OUNCE_TO_GRAM; // convert to grams
  });
  localStorage.setItem(key, JSON.stringify(rates));
  return rates;
};

const fetchRate = async (from, to, date) => {
  if (from === to) return 1;

  const cacheKey = `rate_${from}_${to}_${date}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    const num = parseFloat(cached);
    if (!isNaN(num)) return num;
  }

  const useFrankfurter =
    frankfurterCodes.includes(from) &&
    frankfurterCodes.includes(to) &&
    !METAL_CODES.includes(from) &&
    !METAL_CODES.includes(to);

  if (useFrankfurter) {
    try {
    if (from === "USD" && to === "AED") {
      localStorage.setItem(cacheKey, 3.6725);
      return 3.6725;
    }
    if (from === "AED" && to === "USD") {
      localStorage.setItem(cacheKey, 1 / 3.6725);
      return 1 / 3.6725;
    }
    if (from === "AED") {
      const resp = await fetch(
        `https://api.frankfurter.app/${date}?from=USD&to=${to}`
      );
      if (!resp.ok) throw new Error("Request failed!");
      const data = await resp.json();
      const usdToSecond = data.rates[to];
      const rate = (1 / 3.6725) * usdToSecond;
      localStorage.setItem(cacheKey, rate);
      return rate;
    }
    if (to === "AED") {
      const resp = await fetch(
        `https://api.frankfurter.app/${date}?from=${from}&to=USD`
      );
      if (!resp.ok) throw new Error("Request failed!");
      const data = await resp.json();
      const firstToUsd = data.rates["USD"];
      const rate = firstToUsd * 3.6725;
      localStorage.setItem(cacheKey, rate);
      return rate;
    }
    const response = await fetch(
      `https://api.frankfurter.app/${date}?from=${from}&to=${to}`
    );
    if (!response.ok) throw new Error("Request failed!");
    const data = await response.json();
    const rate = data.rates[to];
    localStorage.setItem(cacheKey, rate);
    return rate;
    } catch (e) {
      const fromCache = localStorage.getItem(cacheKey);
      const num = parseFloat(fromCache || '');
      if (!isNaN(num)) {
        try { localStorage.setItem('rate_fallback_used', '1'); } catch {}
        return num;
      }
      throw e;
    }
  }

  const rates = await fetchOpenRates(date);
  const fromRate = from === "USD" ? 1 : rates[from];
  const toRate = to === "USD" ? 1 : rates[to];
  if (fromRate == null || toRate == null) throw new Error("Rate not found");
  const rate = toRate / fromRate;
  localStorage.setItem(cacheKey, rate);
  return rate;
};

function Currency({ isSuper, onTitleClick, notify }) {
  const { t } = useTranslation();
  const addInputRef = useRef(null);

  const getSymbol = (code) => {
    if (code === "XAU") return t("gold");
    if (code === "XAG") return t("silver");
    return currencySymbols[code] || code;
  };
  const defaultCodes = (process.env.REACT_APP_DEFAULT_CURRENCIES || 'USD,TRY,AED')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
  const [currencies, setCurrencies] = useState(() =>
    defaultCodes.map((code, idx) => ({
      code,
      amount: idx === 0 ? 1 : 0,
      rate: idx === 0 ? 1 : 0,
      input: String(idx === 0 ? 1 : 0),
    }))
  );
  const MIN_DATE = "2013-04-01";
  const today = new Date().toISOString().slice(0, 10);
  const [currencyTime, setCurrencyTime] = useState(today);
  const [showAdd, setShowAdd] = useState(false);
  const [baseIndex, setBaseIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 576);
  const [compareTime, setCompareTime] = useState(null);
  const [compareAmounts, setCompareAmounts] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingCompare, setIsUpdatingCompare] = useState(false);
  const [usedCached, setUsedCached] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Restore state from localStorage (persisted UX)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('converter.state.v1');
      if (saved) {
        const st = JSON.parse(saved);
        if (Array.isArray(st.currencies) && st.currencies.length) {
          const withInputs = st.currencies.map((c) => ({
            ...c,
            input:
              c.input != null
                ? String(c.input)
                : (c.amount != null ? String(c.amount) : ''),
          }));
          setCurrencies(withInputs);
        }
        if (typeof st.baseIndex === 'number') setBaseIndex(st.baseIndex);
        if (typeof st.currencyTime === 'string') setCurrencyTime(st.currencyTime);
        if (st.compareTime) setCompareTime(st.compareTime);
      }
    } catch {}
  }, []);

  // Persist state
  useEffect(() => {
    try {
      const st = { currencies, baseIndex, currencyTime, compareTime };
      localStorage.setItem('converter.state.v1', JSON.stringify(st));
    } catch {}
  }, [currencies, baseIndex, currencyTime, compareTime]);

  const formatTwoLines = (text) => {
    const parts = text.split(' ');
    if (parts.length === 1) return text;
    const last = parts.pop();
    return (
      <>
        {parts.join(' ')}<br />{last}
      </>
    );
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 576);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('rates.lastUpdated');
      if (saved) setLastUpdated(new Date(saved).toLocaleString());
    } catch {}
  }, []);

  // Keyboard shortcuts: arrows for day; Alt+arrows for month; Shift+Alt+arrows for year; 't' => today; 'x' => clear compare
  useEffect(() => {
    const onKey = (e) => {
      const key = (e && e.key ? e.key : '').toLowerCase();
      const useCompare = !!compareTime && e.ctrlKey;
      try {
        if (key === 't') {
          e.preventDefault();
          handleToday();
          return;
        }
        if (key === 'x' && compareTime) {
          e.preventDefault();
          handleClearCompare();
          return;
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          const dir = e.key === 'ArrowLeft' ? -1 : 1;
          if (e.altKey && e.shiftKey) {
            useCompare ? changeCompareYear(dir) : changeYear(dir);
          } else if (e.altKey) {
            useCompare ? changeCompareMonth(dir) : changeMonth(dir);
          } else {
            useCompare ? changeCompareDate(dir) : changeDate(dir);
          }
        }
      } catch {}
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [compareTime, currencyTime, baseIndex]);

  const nextDayDisabled = currencyTime >= today;
  const nextMonthDisabled = currencyTime >= today;
  const nextYearDisabled = currencyTime >= today;
  const prevDayDisabled = currencyTime <= MIN_DATE;
  const prevMonthDisabled = currencyTime <= MIN_DATE;
  const prevYearDisabled = currencyTime <= MIN_DATE;

  const compareNextDayDisabled = !compareTime || compareTime >= today;
  const compareNextMonthDisabled = !compareTime || compareTime >= today;
  const compareNextYearDisabled = !compareTime || compareTime >= today;
  const comparePrevDayDisabled = !compareTime || compareTime <= MIN_DATE;
  const comparePrevMonthDisabled = !compareTime || compareTime <= MIN_DATE;
  const comparePrevYearDisabled = !compareTime || compareTime <= MIN_DATE;

  const changeDate = (days) => {
    const d = new Date(currencyTime);
    d.setDate(d.getDate() + days);
    let newDate = d.toISOString().slice(0, 10);
    if (days < 0 && newDate < MIN_DATE) newDate = MIN_DATE;
    if (days > 0 && newDate > today) return;
    handleDateSelection({ target: { value: newDate } });
  };

  const changeMonth = (months) => {
    const d = new Date(currencyTime);
    d.setMonth(d.getMonth() + months);
    let newDate = d.toISOString().slice(0, 10);
    if (months > 0 && newDate > today) newDate = today;
    if (months < 0 && newDate < MIN_DATE) newDate = MIN_DATE;
    handleDateSelection({ target: { value: newDate } });
  };

  const changeYear = (years) => {
    const d = new Date(currencyTime);
    d.setFullYear(d.getFullYear() + years);
    let newDate = d.toISOString().slice(0, 10);
    if (years > 0 && newDate > today) newDate = today;
    if (years < 0 && newDate < MIN_DATE) newDate = MIN_DATE;
    handleDateSelection({ target: { value: newDate } });
  };

  const changeCompareDate = (days) => {
    if (!compareTime) return;
    const d = new Date(compareTime);
    d.setDate(d.getDate() + days);
    let newDate = d.toISOString().slice(0, 10);
    if (days < 0 && newDate < MIN_DATE) newDate = MIN_DATE;
    if (days > 0 && newDate > today) return;
    setCompareTime(newDate);
  };

  const changeCompareMonth = (months) => {
    if (!compareTime) return;
    const d = new Date(compareTime);
    d.setMonth(d.getMonth() + months);
    let newDate = d.toISOString().slice(0, 10);
    if (months > 0 && newDate > today) newDate = today;
    if (months < 0 && newDate < MIN_DATE) newDate = MIN_DATE;
    setCompareTime(newDate);
  };

  const changeCompareYear = (years) => {
    if (!compareTime) return;
    const d = new Date(compareTime);
    d.setFullYear(d.getFullYear() + years);
    let newDate = d.toISOString().slice(0, 10);
    if (years > 0 && newDate > today) newDate = today;
    if (years < 0 && newDate < MIN_DATE) newDate = MIN_DATE;
    setCompareTime(newDate);
  };

  const handleDateSelection = (e) => {
    const val = e.target.value;
    setCurrencyTime(val);
  };

  const codesList = currencies.map((c) => c.code).join();
  useEffect(() => {
    let alive = true;
    const handle = setTimeout(async () => {
      setIsUpdating(true);
      setUsedCached(false);
      try {
        const base = currencies[baseIndex];
        const baseRaw = base?.input != null ? base.input : base?.amount;
        const baseAmountNum = (typeof baseRaw === 'number')
          ? baseRaw
          : parseFloat(String(baseRaw).replace(/,/g, '')) || 0;
        const updated = await Promise.all(
          currencies.map(async (c, idx) => {
            if (idx === baseIndex)
              return {
                ...c,
                rate: 1,
                amount: baseAmountNum,
                input: Number(baseAmountNum).toLocaleString('en-US', { maximumFractionDigits: 6 }),
              };
            const rate = await fetchRate(base.code, c.code, currencyTime);
            const nextAmount = (baseAmountNum * rate);
            return {
              ...c,
              rate,
              amount: nextAmount,
              input: Number(nextAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }),
            };
          })
        );
        if (!alive) return;
        setCurrencies(updated);
        const flag = localStorage.getItem('rate_fallback_used');
        if (flag) {
          setUsedCached(true);
          localStorage.removeItem('rate_fallback_used');
        }
        const now = new Date();
        setLastUpdated(now.toLocaleString());
        try { localStorage.setItem('rates.lastUpdated', now.toISOString()); } catch {}
      } catch (err) {
        if (notify) notify('Failed to update latest rates', 'error');
      } finally {
        if (alive) setIsUpdating(false);
      }
    }, 250);
    return () => {
      alive = false;
      clearTimeout(handle);
    };
  }, [currencyTime, baseIndex, currencies[baseIndex].code, currencies[baseIndex].amount, codesList]);

  useEffect(() => {
    if (!compareTime) {
      setCompareAmounts([]);
      return;
    }
    let alive = true;
    const handle = setTimeout(async () => {
      setIsUpdatingCompare(true);
      try {
        const base = currencies[baseIndex];
        const baseRaw = base?.input != null ? base.input : base?.amount;
        const baseVal = (typeof baseRaw === 'number')
          ? baseRaw
          : parseFloat(String(baseRaw).replace(/,/g, '')) || 0;
        const res = await Promise.all(
          currencies.map(async (c, idx) => {
            if (idx === baseIndex) return baseVal;
            const rate = await fetchRate(base.code, c.code, compareTime);
            return (baseVal * rate);
          })
        );
        if (alive) setCompareAmounts(res);
        const flag = localStorage.getItem('rate_fallback_used');
        if (flag) {
          setUsedCached(true);
          localStorage.removeItem('rate_fallback_used');
        }
        const now = new Date();
        setLastUpdated(now.toLocaleString());
        try { localStorage.setItem('rates.lastUpdated', now.toISOString()); } catch {}
      } catch (err) {
        if (notify) notify('Failed to update comparison', 'error');
      } finally {
        if (alive) setIsUpdatingCompare(false);
      }
    }, 250);
    return () => {
      alive = false;
      clearTimeout(handle);
    };
  }, [compareTime, baseIndex, currencies[baseIndex].code, currencies[baseIndex].amount, codesList]);

  const handleAmountChange = (index, value) => {
    const parseValue = (val) => {
      if (typeof val === "string") {
        const upper = val.trim().toUpperCase();
        if (upper === "M") return 1000000;
        if (upper === "K") return 1000;
        if (upper.endsWith("M")) {
          const num = parseFloat(upper.slice(0, -1).replace(/,/g, ''));
          return (isNaN(num) ? 1 : num) * 1000000;
        }
        if (upper.endsWith("K")) {
          const num = parseFloat(upper.slice(0, -1).replace(/,/g, ''));
          return (isNaN(num) ? 1 : num) * 1000;
        }
        return parseFloat(val.replace(/\s+/g, '').replace(/,/g, ''));
      }
      const num = parseFloat(val);
      return isNaN(num) ? 0 : num;
    };
    let amount = parseValue(value);
    if (amount < 0) amount = 0;
    setCurrencies((prev) => {
      const baseAmountOld = prev[index].rate ? amount / prev[index].rate : amount;
      return prev.map((c, idx) => {
        if (idx === index) {
          return {
            ...c,
            amount,
            input: String(value),
          };
        }
        if (!c.rate) return c;
        const next = (baseAmountOld * c.rate);
        return {
          ...c,
          amount: isFinite(next) ? next : c.amount,
          rate: c.rate,
          input: isFinite(next)
            ? Number(next).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })
            : c.input,
        };
      });
    });
    setBaseIndex(index);
  };

  const handleCurrencyChange = (index, code) => {
    setCurrencies((prev) =>
      prev.map((c, idx) => (idx === index ? { ...c, code } : c))
    );
  };

  const handleRemoveCurrency = (index) => {
    const code = currencies[index]?.code;
      setCurrencies((prev) => {
        const filtered = prev.filter((_, i) => i !== index);
        if (baseIndex >= filtered.length) {
          setBaseIndex(filtered.length - 1);
        } else if (index < baseIndex) {
          setBaseIndex((b) => b - 1);
        }
        return filtered;
      });
    if (notify && code) notify(`Removed ${code}`, 'info');
  };

  const moveCurrency = (index, direction) => {
    setCurrencies((prev) => {
      const next = [...prev];
      const newIndex = Math.max(0, Math.min(next.length - 1, index + direction));
      if (newIndex === index) return prev;
      const [item] = next.splice(index, 1);
      next.splice(newIndex, 0, item);
      // adjust baseIndex to follow the same item
      if (baseIndex === index) {
        setBaseIndex(newIndex);
      } else if (index < baseIndex && newIndex >= baseIndex) {
        setBaseIndex((b) => b - 1);
      } else if (index > baseIndex && newIndex <= baseIndex) {
        setBaseIndex((b) => b + 1);
      }
      return next;
    });
  };

  const reorderCurrency = (fromIndex, toIndex) => {
    setCurrencies((prev) => {
      const next = [...prev];
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= next.length || toIndex >= next.length) return prev;
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      if (baseIndex === fromIndex) {
        setBaseIndex(toIndex);
      } else if (fromIndex < baseIndex && toIndex >= baseIndex) {
        setBaseIndex((b) => b - 1);
      } else if (fromIndex > baseIndex && toIndex <= baseIndex) {
        setBaseIndex((b) => b + 1);
      }
      return next;
    });
  };

  const copyToClipboard = async (text) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      if (notify) notify('Copied', 'success');
    } catch {
      if (notify) notify('Copy failed', 'error');
    }
  };

  const handleToday = () => {
    setCurrencyTime(today);
  };

  const handleLastYear = () => {
    const d = new Date(currencyTime);
    d.setFullYear(d.getFullYear() - 1);
    setCompareTime(d.toISOString().slice(0, 10));
  };

  const handleFiveYears = () => {
    const d = new Date(currencyTime);
    d.setFullYear(d.getFullYear() - 5);
    setCompareTime(d.toISOString().slice(0, 10));
  };

  const handleClearCompare = () => {
    setCompareTime(null);
  };

  // shareState removed

  return (
    <div className={`currencyDiv${compareTime ? ' compareMode' : ''}`}>
      {isOffline && (
        <div className="offlineBadge" aria-live="polite" title={`Offline mode${lastUpdated ? ` (last: ${lastUpdated})` : ''}`}>
          Offline
        </div>
      )}
      {(isUpdating || isUpdatingCompare) && <div className="progressBar" />}
      <h1 onClick={onTitleClick}>{t('title')}</h1>
      {(isUpdating || isUpdatingCompare) && (
        <div className="loadingNotice" aria-live="polite">
          Updating rates...
        </div>
      )}
      {usedCached && (
        <div className="loadingNotice" aria-live="polite">
          Using cached rates
        </div>
      )}
      {lastUpdated && (
        <div className="loadingNotice" aria-live="polite">
          Last updated: {lastUpdated}
      </div>
      )}
      {isSuper ? (
        <>
          <div className="dateNavigator" role="group" aria-label="Navigate dates">
            <Button
              as={motion.button}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => changeYear(-1)}
              disabled={prevYearDisabled}
              aria-label="Previous year"
            >
              {"<<<"}
            </Button>
            <Button
              as={motion.button}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => changeMonth(-1)}
              disabled={prevMonthDisabled}
              aria-label="Previous month"
            >
              {"<<"}
            </Button>
            <Button
              as={motion.button}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => changeDate(-1)}
              disabled={prevDayDisabled}
              aria-label="Previous day"
            >
              {"<"}
            </Button>
            <DatePicker
              selected={new Date(currencyTime)}
              onChange={(date) =>
                handleDateSelection({
                  target: { value: date.toISOString().slice(0, 10) },
                })
              }
              maxDate={new Date()}
              minDate={new Date(MIN_DATE)}
              dateFormat="yyyy-MM-dd"
              showYearDropdown
              dropdownMode="select"
              inputReadOnly
              onFocus={(e) => e.target.blur()}
              withPortal={isMobile}
            />
            <Button
              as={motion.button}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => changeDate(1)}
              disabled={nextDayDisabled}
              aria-label="Next day"
            >
              {">"}
            </Button>
            <Button
              as={motion.button}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => changeMonth(1)}
              disabled={nextMonthDisabled}
              aria-label="Next month"
            >
              {">>"}
            </Button>
            <Button
              as={motion.button}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => changeYear(1)}
              disabled={nextYearDisabled}
              aria-label="Next year"
            >
              {">>>"}
            </Button>
          </div>
          {compareTime && (
            <div className="dateNavigator" role="group" style={{ marginTop: 8 }} aria-label="Navigate comparison dates">
              <Button
                as={motion.button}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => changeCompareYear(-1)}
                disabled={comparePrevYearDisabled}
                aria-label="Previous compare year"
              >
                {"<<<"}
              </Button>
              <Button
                as={motion.button}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => changeCompareMonth(-1)}
                disabled={comparePrevMonthDisabled}
                aria-label="Previous compare month"
              >
                {"<<"}
              </Button>
              <Button
                as={motion.button}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => changeCompareDate(-1)}
                disabled={comparePrevDayDisabled}
                aria-label="Previous compare day"
              >
                {"<"}
              </Button>
              <DatePicker
                selected={new Date(compareTime)}
                onChange={(date) =>
                  setCompareTime(date.toISOString().slice(0, 10))
                }
                maxDate={new Date()}
                minDate={new Date(MIN_DATE)}
                dateFormat="yyyy-MM-dd"
                showYearDropdown
                dropdownMode="select"
                inputReadOnly
                onFocus={(e) => e.target.blur()}
                withPortal={isMobile}
              />
              <Button
                as={motion.button}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => changeCompareDate(1)}
                disabled={compareNextDayDisabled}
                aria-label="Next compare day"
              >
                {">"}
              </Button>
              <Button
                as={motion.button}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => changeCompareMonth(1)}
                disabled={compareNextMonthDisabled}
                aria-label="Next compare month"
              >
                {">>"}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className={`dateRow${compareTime ? '' : ' single'}`} role="group" aria-label="Dates">
          <DatePicker
            selected={new Date(currencyTime)}
            onChange={(date) =>
              handleDateSelection({
                target: { value: date.toISOString().slice(0, 10) },
              })
            }
            maxDate={new Date()}
            minDate={new Date(MIN_DATE)}
            dateFormat="yyyy-MM-dd"
            showYearDropdown
            dropdownMode="select"
            inputReadOnly
            onFocus={(e) => e.target.blur()}
            withPortal={isMobile}
          />
          {compareTime && (
            <DatePicker
              selected={new Date(compareTime)}
              onChange={(date) =>
                setCompareTime(date.toISOString().slice(0, 10))
              }
              maxDate={new Date()}
              minDate={new Date(MIN_DATE)}
              dateFormat="yyyy-MM-dd"
              showYearDropdown
              dropdownMode="select"
              inputReadOnly
              onFocus={(e) => e.target.blur()}
              withPortal={isMobile}
            />
          )}
        </div>
      )}
      <div className="currencySelection">
        <div className="dropdown">
          <AnimatePresence>
            {currencies.map((c, idx) => (
              <motion.div
                className="currencyRow"
                key={idx}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                draggable
                onDragStart={(e) => {
                  try { e.dataTransfer.setData('text/plain', String(idx)); } catch {}
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
                  if (!Number.isNaN(from) && from !== idx) {
                    reorderCurrency(from, idx);
                  }
                }}
                onTouchStart={(e) => {
                  const t = e.changedTouches[0];
                  e.currentTarget.dataset.tsx = String(t.clientX);
                  e.currentTarget.dataset.tsy = String(t.clientY);
                }}
                onTouchEnd={(e) => {
                  const t = e.changedTouches[0];
                  const sx = parseFloat(e.currentTarget.dataset.tsx || '0');
                  const sy = parseFloat(e.currentTarget.dataset.tsy || '0');
                  const dx = t.clientX - sx;
                  const dy = t.clientY - sy;
                  // Detect quick left swipe (avoid vertical scroll)
                  if (dx < -50 && Math.abs(dy) < 20) {
                    handleRemoveCurrency(idx);
                  }
                }}
              >
                {/* drag handle moved to end; entire row is draggable */}
                <Form.Select
                  value={c.code}
                  onChange={(e) => handleCurrencyChange(idx, e.target.value)}
                  aria-label={`Currency code ${idx + 1}`}
                >
                  {orderedCodes
                    .filter(
                      (code) =>
                        code === c.code ||
                        !currencies.some((c2, j) => j !== idx && c2.code === code)
                    )
                    .map((code) => (
                      <option key={code} value={code}>
                        {`${getFlag(code)} ${getSymbol(code)} (${code})`}
                      </option>
                    ))}
                </Form.Select>
                <Form.Control
                  type="text"
                  inputMode="decimal"
                  enterKeyHint="done"
                  value={c.input ?? ''}
                  onKeyDown={(e) => {
                    const key = (e && e.key ? e.key : '').toLowerCase();
                    if (key === "m" || key === "k") {
                      e.preventDefault();
                      const zeros = key === "m" ? "000000" : "000";
                      const cleaned = String(e.target.value).replace(/[^0-9.]/g, "");
                      handleAmountChange(idx, cleaned + zeros);
                    }
                  }}
                  onFocus={() => {
                    setBaseIndex(idx);
                    // remove grouping for editing
                    setCurrencies((prev) =>
                      prev.map((row, j) =>
                        j === idx
                          ? { ...row, input: String(row.input ?? row.amount ?? '').replace(/,/g, '') }
                          : row
                      )
                    );
                  }}
                  onBlur={() => {
                    // apply grouping formatting after edit
                    setCurrencies((prev) => {
                      const next = [...prev];
                      const cur = next[idx];
                      const raw = cur?.input ?? '';
                      const num = parseFloat(String(raw).replace(/,/g, ''));
                      if (!Number.isNaN(num)) {
                        const decimals = (String(raw).split('.')[1]?.length) || 0;
                        const formatted = Number(num).toLocaleString('en-US', {
                          minimumFractionDigits: Math.min(decimals, 6),
                          maximumFractionDigits: Math.min(Math.max(decimals, 2), 6),
                        });
                        next[idx] = { ...cur, input: formatted };
                      }
                      return next;
                    });
                  }}
                  onChange={(e) => handleAmountChange(idx, e.target.value)}
          />
          {compareTime && (
                  <Form.Control
                    type="text"
                    readOnly
                    className="compareInput"
                    value={
                      compareAmounts[idx] != null
                        ? Number(compareAmounts[idx]).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })
                        : ''
                    }
                  />
                )}
                {isSuper && (
                  <Button
                    variant="secondary"
                    className="copyIcon"
                    aria-label={`Copy ${c.code} amount`}
                    onClick={() => {
                      const code = c.code;
                      const display = (c.input ?? '').toString().trim();
                      const toCopy = `${display} ${code}`.trim();
                      copyToClipboard(toCopy);
                    }}
                    title="Copy amount"
                  >
                    📋
                  </Button>
                )}
                {currencies.length >= 3 && (
                  <Button
                    variant="danger"
                    className="minusIcon"
                    aria-label={`Remove ${c.code}`}
                    onClick={() => handleRemoveCurrency(idx)}
                  >
                    🗑️
                  </Button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {showAdd && (
            <>
              {isMobile ? (
                <Form.Select
                  className="addSelect"
                  aria-label="Select currency to add"
                  ref={addInputRef}
                  defaultValue=""
                  onChange={(e) => {
                    // keep selection but require confirm tap to add (consistent UX)
                    if (addInputRef.current) addInputRef.current.value = e.target.value;
                  }}
                >
                  <option value="">{t('select_currency')}</option>
                  {orderedCodes
                    .filter((code) => !currencies.some((c) => c.code === code))
                    .map((code) => (
                      <option key={code} value={code}>
                        {`${getFlag(code)} ${getSymbol(code)} (${code})`}
                      </option>
                    ))}
                </Form.Select>
              ) : (
                <>
                  <input
                    type="text"
                    list="addCurrencyList"
                    className="addSelect"
                    placeholder={t('select_currency')}
                    aria-label="Add currency code"
                    ref={addInputRef}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = e.currentTarget.value.trim().toUpperCase();
                        if (!val) return;
                        if (currencies.some((c) => c.code === val)) return;
                        if (!orderedCodes.includes(val)) return;
                        setCurrencies((prev) => [
                          ...prev,
                          { code: val, amount: 0, rate: 0, input: '0' },
                        ]);
                        e.currentTarget.value = '';
                        setShowAdd(false);
                      }
                    }}
                  />
                  <datalist id="addCurrencyList">
                    {orderedCodes
                      .filter((code) => !currencies.some((c) => c.code === code))
                      .map((code) => (
                        <option key={code} value={code}>{`${getFlag(code)} ${getSymbol(code)} (${code})`}</option>
                      ))}
                  </datalist>
                </>
              )}
              <Button
                as={motion.button}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="confirmAdd"
                aria-label="Add selected currency"
                onClick={() => {
                  const val = (addInputRef.current?.value || '').trim().toUpperCase();
                  if (!val) return;
                  if (!orderedCodes.includes(val)) return;
                  if (currencies.some((c) => c.code === val)) return;
                  setCurrencies((prev) => [
                    ...prev,
                    { code: val, amount: 0, rate: 0, input: '0' },
                  ]);
                  if (addInputRef.current) addInputRef.current.value = '';
                  setShowAdd(false);
                  // Bring the newly added row into view and focus its input on mobile
                  try {
                    requestAnimationFrame(() => {
                      const inputs = document.querySelectorAll('.currencyRow input[type="text"]');
                      const last = inputs[inputs.length - 1];
                      if (last) {
                        last.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        last.focus();
                      }
                    });
                  } catch {}
                }}
              >
                ➕
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="presetRow">
        <div className="presetLeft">
          {currencies.length < 8 && (
            <Button
              as={motion.button}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              variant="success"
              className="plusIcon"
              onClick={() => setShowAdd(!showAdd)}
              aria-label="Add currency"
              title="Add currency"
            >
              {showAdd ? "➖" : "➕"}
            </Button>
          )}
        </div>
        <div className="presetRange">
          {!compareTime && currencyTime !== today && (
            <Button
              as={motion.button}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Jump to today"
              onClick={handleToday}
            >
              📅 {t('today')}
            </Button>
          )}
          <Button
            as={motion.button}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={t('last_year')}
            onClick={handleLastYear}
          >
            📅 {t('last_year')}
          </Button>
          <Button
            as={motion.button}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={t('five_years_ago')}
            onClick={handleFiveYears}
          >
            📅 {t('five_years_ago')}
          </Button>
        </div>
        {compareTime && (
          <Button
            as={motion.button}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            variant="secondary"
            aria-label="Clear compare"
            onClick={handleClearCompare}
            className="clearBtn"
          >
            ✖
          </Button>
        )}
        
      </div>
    </div>
  );
}

export default Currency;
