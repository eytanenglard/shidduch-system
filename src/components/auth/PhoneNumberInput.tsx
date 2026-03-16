// src/components/auth/PhoneNumberInput.tsx
'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { Phone, ChevronDown, Search, X, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// TYPES
// ============================================================================

interface Country {
  code: string;
  name: string;
  nameHe: string;
  flag: string;
  prefix: string;
  popular: boolean;
  placeholder: string;
}

interface PhoneNumberInputProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
  locale: 'he' | 'en';
  error?: string;
  placeholder?: string;
}

// ============================================================================
// COUNTRY LIST
// ============================================================================

const COUNTRIES: Country[] = [
  // Popular countries
  {
    code: 'IL',
    name: 'Israel',
    nameHe: 'ישראל',
    flag: '🇮🇱',
    prefix: '+972',
    popular: true,
    placeholder: '50-123-4567',
  },
  {
    code: 'US',
    name: 'United States',
    nameHe: 'ארצות הברית',
    flag: '🇺🇸',
    prefix: '+1',
    popular: true,
    placeholder: '555-123-4567',
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    nameHe: 'בריטניה',
    flag: '🇬🇧',
    prefix: '+44',
    popular: true,
    placeholder: '7123 456789',
  },
  {
    code: 'CA',
    name: 'Canada',
    nameHe: 'קנדה',
    flag: '🇨🇦',
    prefix: '+1',
    popular: true,
    placeholder: '555-123-4567',
  },
  {
    code: 'FR',
    name: 'France',
    nameHe: 'צרפת',
    flag: '🇫🇷',
    prefix: '+33',
    popular: true,
    placeholder: '06 12 34 56 78',
  },
  // Rest of countries
  {
    code: 'AR',
    name: 'Argentina',
    nameHe: 'ארגנטינה',
    flag: '🇦🇷',
    prefix: '+54',
    popular: false,
    placeholder: '11 1234-5678',
  },
  {
    code: 'AU',
    name: 'Australia',
    nameHe: 'אוסטרליה',
    flag: '🇦🇺',
    prefix: '+61',
    popular: false,
    placeholder: '412 345 678',
  },
  {
    code: 'AT',
    name: 'Austria',
    nameHe: 'אוסטריה',
    flag: '🇦🇹',
    prefix: '+43',
    popular: false,
    placeholder: '664 123456',
  },
  {
    code: 'BE',
    name: 'Belgium',
    nameHe: 'בלגיה',
    flag: '🇧🇪',
    prefix: '+32',
    popular: false,
    placeholder: '470 12 34 56',
  },
  {
    code: 'BR',
    name: 'Brazil',
    nameHe: 'ברזיל',
    flag: '🇧🇷',
    prefix: '+55',
    popular: false,
    placeholder: '11 91234-5678',
  },
  {
    code: 'BG',
    name: 'Bulgaria',
    nameHe: 'בולגריה',
    flag: '🇧🇬',
    prefix: '+359',
    popular: false,
    placeholder: '87 123 4567',
  },
  {
    code: 'CL',
    name: 'Chile',
    nameHe: "צ'ילה",
    flag: '🇨🇱',
    prefix: '+56',
    popular: false,
    placeholder: '9 1234 5678',
  },
  {
    code: 'CO',
    name: 'Colombia',
    nameHe: 'קולומביה',
    flag: '🇨🇴',
    prefix: '+57',
    popular: false,
    placeholder: '300 123 4567',
  },
  {
    code: 'HR',
    name: 'Croatia',
    nameHe: 'קרואטיה',
    flag: '🇭🇷',
    prefix: '+385',
    popular: false,
    placeholder: '91 234 567',
  },
  {
    code: 'CZ',
    name: 'Czech Republic',
    nameHe: "צ'כיה",
    flag: '🇨🇿',
    prefix: '+420',
    popular: false,
    placeholder: '601 123 456',
  },
  {
    code: 'DK',
    name: 'Denmark',
    nameHe: 'דנמרק',
    flag: '🇩🇰',
    prefix: '+45',
    popular: false,
    placeholder: '20 12 34 56',
  },
  {
    code: 'EE',
    name: 'Estonia',
    nameHe: 'אסטוניה',
    flag: '🇪🇪',
    prefix: '+372',
    popular: false,
    placeholder: '5123 4567',
  },
  {
    code: 'FI',
    name: 'Finland',
    nameHe: 'פינלנד',
    flag: '🇫🇮',
    prefix: '+358',
    popular: false,
    placeholder: '40 123 4567',
  },
  {
    code: 'GE',
    name: 'Georgia',
    nameHe: 'גאורגיה',
    flag: '🇬🇪',
    prefix: '+995',
    popular: false,
    placeholder: '555 12 34 56',
  },
  {
    code: 'DE',
    name: 'Germany',
    nameHe: 'גרמניה',
    flag: '🇩🇪',
    prefix: '+49',
    popular: false,
    placeholder: '1512 3456789',
  },
  {
    code: 'GR',
    name: 'Greece',
    nameHe: 'יוון',
    flag: '🇬🇷',
    prefix: '+30',
    popular: false,
    placeholder: '694 123 4567',
  },
  {
    code: 'HU',
    name: 'Hungary',
    nameHe: 'הונגריה',
    flag: '🇭🇺',
    prefix: '+36',
    popular: false,
    placeholder: '20 123 4567',
  },
  {
    code: 'IN',
    name: 'India',
    nameHe: 'הודו',
    flag: '🇮🇳',
    prefix: '+91',
    popular: false,
    placeholder: '91234 56789',
  },
  {
    code: 'IE',
    name: 'Ireland',
    nameHe: 'אירלנד',
    flag: '🇮🇪',
    prefix: '+353',
    popular: false,
    placeholder: '85 123 4567',
  },
  {
    code: 'IT',
    name: 'Italy',
    nameHe: 'איטליה',
    flag: '🇮🇹',
    prefix: '+39',
    popular: false,
    placeholder: '312 345 6789',
  },
  {
    code: 'LV',
    name: 'Latvia',
    nameHe: 'לטביה',
    flag: '🇱🇻',
    prefix: '+371',
    popular: false,
    placeholder: '21 234 567',
  },
  {
    code: 'LT',
    name: 'Lithuania',
    nameHe: 'ליטא',
    flag: '🇱🇹',
    prefix: '+370',
    popular: false,
    placeholder: '612 34567',
  },
  {
    code: 'LU',
    name: 'Luxembourg',
    nameHe: 'לוקסמבורג',
    flag: '🇱🇺',
    prefix: '+352',
    popular: false,
    placeholder: '621 123 456',
  },
  {
    code: 'MX',
    name: 'Mexico',
    nameHe: 'מקסיקו',
    flag: '🇲🇽',
    prefix: '+52',
    popular: false,
    placeholder: '55 1234 5678',
  },
  {
    code: 'MD',
    name: 'Moldova',
    nameHe: 'מולדובה',
    flag: '🇲🇩',
    prefix: '+373',
    popular: false,
    placeholder: '621 12 345',
  },
  {
    code: 'NL',
    name: 'Netherlands',
    nameHe: 'הולנד',
    flag: '🇳🇱',
    prefix: '+31',
    popular: false,
    placeholder: '6 12345678',
  },
  {
    code: 'NZ',
    name: 'New Zealand',
    nameHe: 'ניו זילנד',
    flag: '🇳🇿',
    prefix: '+64',
    popular: false,
    placeholder: '21 123 4567',
  },
  {
    code: 'NO',
    name: 'Norway',
    nameHe: 'נורווגיה',
    flag: '🇳🇴',
    prefix: '+47',
    popular: false,
    placeholder: '412 34 567',
  },
  {
    code: 'PA',
    name: 'Panama',
    nameHe: 'פנמה',
    flag: '🇵🇦',
    prefix: '+507',
    popular: false,
    placeholder: '6123-4567',
  },
  {
    code: 'PE',
    name: 'Peru',
    nameHe: 'פרו',
    flag: '🇵🇪',
    prefix: '+51',
    popular: false,
    placeholder: '912 345 678',
  },
  {
    code: 'PL',
    name: 'Poland',
    nameHe: 'פולין',
    flag: '🇵🇱',
    prefix: '+48',
    popular: false,
    placeholder: '501 234 567',
  },
  {
    code: 'PT',
    name: 'Portugal',
    nameHe: 'פורטוגל',
    flag: '🇵🇹',
    prefix: '+351',
    popular: false,
    placeholder: '912 345 678',
  },
  {
    code: 'RO',
    name: 'Romania',
    nameHe: 'רומניה',
    flag: '🇷🇴',
    prefix: '+40',
    popular: false,
    placeholder: '712 345 678',
  },
  {
    code: 'RU',
    name: 'Russia',
    nameHe: 'רוסיה',
    flag: '🇷🇺',
    prefix: '+7',
    popular: false,
    placeholder: '912 123-45-67',
  },
  {
    code: 'RS',
    name: 'Serbia',
    nameHe: 'סרביה',
    flag: '🇷🇸',
    prefix: '+381',
    popular: false,
    placeholder: '60 1234567',
  },
  {
    code: 'SK',
    name: 'Slovakia',
    nameHe: 'סלובקיה',
    flag: '🇸🇰',
    prefix: '+421',
    popular: false,
    placeholder: '901 123 456',
  },
  {
    code: 'SI',
    name: 'Slovenia',
    nameHe: 'סלובניה',
    flag: '🇸🇮',
    prefix: '+386',
    popular: false,
    placeholder: '31 234 567',
  },
  {
    code: 'ZA',
    name: 'South Africa',
    nameHe: 'דרום אפריקה',
    flag: '🇿🇦',
    prefix: '+27',
    popular: false,
    placeholder: '82 123 4567',
  },
  {
    code: 'ES',
    name: 'Spain',
    nameHe: 'ספרד',
    flag: '🇪🇸',
    prefix: '+34',
    popular: false,
    placeholder: '612 34 56 78',
  },
  {
    code: 'SE',
    name: 'Sweden',
    nameHe: 'שבדיה',
    flag: '🇸🇪',
    prefix: '+46',
    popular: false,
    placeholder: '70 123 45 67',
  },
  {
    code: 'CH',
    name: 'Switzerland',
    nameHe: 'שוויץ',
    flag: '🇨🇭',
    prefix: '+41',
    popular: false,
    placeholder: '78 123 45 67',
  },
  {
    code: 'TR',
    name: 'Turkey',
    nameHe: 'טורקיה',
    flag: '🇹🇷',
    prefix: '+90',
    popular: false,
    placeholder: '531 234 56 78',
  },
  {
    code: 'UA',
    name: 'Ukraine',
    nameHe: 'אוקראינה',
    flag: '🇺🇦',
    prefix: '+380',
    popular: false,
    placeholder: '50 123 4567',
  },
  {
    code: 'UY',
    name: 'Uruguay',
    nameHe: 'אורוגוואי',
    flag: '🇺🇾',
    prefix: '+598',
    popular: false,
    placeholder: '91 123 456',
  },
  {
    code: 'VE',
    name: 'Venezuela',
    nameHe: 'ונצואלה',
    flag: '🇻🇪',
    prefix: '+58',
    popular: false,
    placeholder: '412-1234567',
  },
  {
    code: 'JP',
    name: 'Japan',
    nameHe: 'יפן',
    flag: '🇯🇵',
    prefix: '+81',
    popular: false,
    placeholder: '90-1234-5678',
  },
  {
    code: 'CN',
    name: 'China',
    nameHe: 'סין',
    flag: '🇨🇳',
    prefix: '+86',
    popular: false,
    placeholder: '138 0013 8000',
  },
  {
    code: 'KR',
    name: 'South Korea',
    nameHe: 'דרום קוריאה',
    flag: '🇰🇷',
    prefix: '+82',
    popular: false,
    placeholder: '10-1234-5678',
  },
];

// ============================================================================
// ANIMATION
// ============================================================================

const errorVariants = {
  hidden: { opacity: 0, y: -4, height: 0 },
  visible: { opacity: 1, y: 0, height: 'auto', transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -4, height: 0, transition: { duration: 0.15 } },
};

// ============================================================================
// COMPONENT
// ============================================================================

const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  value,
  onChange,
  disabled = false,
  locale,
  error,
  placeholder: externalPlaceholder,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isManualPrefix, setIsManualPrefix] = useState(false);
  const [manualPrefix, setManualPrefix] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInternalUpdateRef = useRef(false); // Guard against infinite loop

  // ============================================================================
  // FILTERED & SORTED COUNTRIES (memoized — no mutation)
  // ============================================================================

  const sortedCountries = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    const filtered = COUNTRIES.filter((country) => {
      const name = locale === 'he' ? country.nameHe : country.name;
      return (
        name.toLowerCase().includes(searchLower) ||
        country.prefix.includes(searchTerm) ||
        country.code.toLowerCase().includes(searchLower)
      );
    });

    // Sort: popular first, then alphabetical — using spread to avoid mutating
    return [...filtered].sort((a, b) => {
      if (a.popular && !b.popular) return -1;
      if (!a.popular && b.popular) return 1;
      const nameA = locale === 'he' ? a.nameHe : a.name;
      const nameB = locale === 'he' ? b.nameHe : b.name;
      return nameA.localeCompare(nameB);
    });
  }, [searchTerm, locale]);

  // ============================================================================
  // UPDATE FULL VALUE
  // ============================================================================

  const updateFullValue = useCallback(
    (prefix: string, number: string) => {
      isInternalUpdateRef.current = true;
      const fullNumber = number ? `${prefix}${number.replace(/\D/g, '')}` : '';
      onChange(fullNumber);
      // Reset guard after microtask
      Promise.resolve().then(() => {
        isInternalUpdateRef.current = false;
      });
    },
    [onChange]
  );

  // ============================================================================
  // PHONE NUMBER CHANGE
  // ============================================================================

  const handlePhoneChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setPhoneNumber(newValue);
      const currentPrefix = isManualPrefix
        ? manualPrefix
        : selectedCountry.prefix;
      updateFullValue(currentPrefix, newValue);
    },
    [isManualPrefix, manualPrefix, selectedCountry.prefix, updateFullValue]
  );

  // ============================================================================
  // MANUAL PREFIX CHANGE
  // ============================================================================

  const handleManualPrefixChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let newPrefix = e.target.value.slice(0, 6); // Limit prefix length
      if (newPrefix && !newPrefix.startsWith('+')) {
        newPrefix = '+' + newPrefix;
      }
      // Only allow + and digits
      newPrefix = newPrefix.replace(/[^+\d]/g, '');
      setManualPrefix(newPrefix);
      updateFullValue(newPrefix, phoneNumber);
    },
    [phoneNumber, updateFullValue]
  );

  // ============================================================================
  // COUNTRY SELECT
  // ============================================================================

  const handleCountrySelect = useCallback(
    (country: Country) => {
      setSelectedCountry(country);
      setIsOpen(false);
      setSearchTerm('');
      setIsManualPrefix(false);
      setManualPrefix('');
      updateFullValue(country.prefix, phoneNumber);
    },
    [phoneNumber, updateFullValue]
  );

  const enableManualPrefix = useCallback(() => {
    setIsManualPrefix(true);
    setManualPrefix(selectedCountry.prefix);
    setIsOpen(false);
  }, [selectedCountry.prefix]);

  const disableManualPrefix = useCallback(() => {
    setIsManualPrefix(false);
    setManualPrefix('');
    updateFullValue(selectedCountry.prefix, phoneNumber);
  }, [selectedCountry.prefix, phoneNumber, updateFullValue]);

  // ============================================================================
  // PARSE INCOMING VALUE (with infinite loop guard)
  // ============================================================================

  useEffect(() => {
    // Skip if this update was triggered by us
    if (isInternalUpdateRef.current) return;

    if (value && value.startsWith('+')) {
      // Try to find matching country (longest prefix match first)
      const sortedByPrefixLength = [...COUNTRIES].sort(
        (a, b) => b.prefix.length - a.prefix.length
      );
      const matchingCountry = sortedByPrefixLength.find((country) =>
        value.startsWith(country.prefix)
      );

      if (matchingCountry) {
        setSelectedCountry(matchingCountry);
        setIsManualPrefix(false);
        setManualPrefix('');
        const numberPart = value.substring(matchingCountry.prefix.length);
        setPhoneNumber(numberPart);
      } else {
        // No matching country — use manual prefix
        const prefixMatch = value.match(/^\+\d+/);
        if (prefixMatch) {
          setIsManualPrefix(true);
          setManualPrefix(prefixMatch[0]);
          const numberPart = value.substring(prefixMatch[0].length);
          setPhoneNumber(numberPart);
        }
      }
    } else if (!value) {
      setPhoneNumber('');
      setIsManualPrefix(false);
      setManualPrefix('');
    }
  }, [value]);

  // ============================================================================
  // CLOSE DROPDOWN ON OUTSIDE CLICK
  // ============================================================================

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Focus search when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ============================================================================
  // KEYBOARD HANDLING
  // ============================================================================

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  }, []);

  // ============================================================================
  // COMPUTED PLACEHOLDER
  // ============================================================================

  const computedPlaceholder = useMemo(() => {
    if (externalPlaceholder) return externalPlaceholder;
    if (isManualPrefix) {
      return locale === 'he' ? 'מספר טלפון' : 'Phone number';
    }
    return locale === 'he'
      ? `לדוגמה: ${selectedCountry.placeholder}`
      : `Example: ${selectedCountry.placeholder}`;
  }, [
    externalPlaceholder,
    isManualPrefix,
    locale,
    selectedCountry.placeholder,
  ]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onKeyDown={handleKeyDown}
    >
      {/* LTR container for phone number layout */}
      <div className="flex gap-2" dir="ltr">
        {/* Country selector / manual prefix */}
        <div className="relative">
          {isManualPrefix ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={manualPrefix}
                onChange={handleManualPrefixChange}
                placeholder="+1"
                disabled={disabled}
                maxLength={6}
                aria-label={locale === 'he' ? 'קידומת טלפון' : 'Phone prefix'}
                className={`
                  w-20 px-2 py-3 text-sm border-2 rounded-xl text-center font-mono
                  transition-all duration-200
                  ${
                    disabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white hover:border-teal-300 focus:ring-2 focus:ring-teal-200 focus:border-teal-500'
                  }
                  ${
                    error
                      ? 'border-red-400 focus:ring-red-200 focus:border-red-500'
                      : 'border-gray-200'
                  }
                `}
              />
              <button
                type="button"
                onClick={disableManualPrefix}
                disabled={disabled}
                className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                title={
                  locale === 'he'
                    ? 'חזור לבחירת מדינה'
                    : 'Back to country selection'
                }
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => !disabled && setIsOpen(!isOpen)}
              disabled={disabled}
              className={`
                flex items-center gap-2 px-3 py-3 border-2 rounded-xl bg-white
                transition-all duration-200 min-w-[140px]
                ${
                  disabled
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'hover:border-teal-300 focus:ring-2 focus:ring-teal-200 focus:border-teal-500'
                }
                ${
                  error
                    ? 'border-red-400 focus:ring-red-200 focus:border-red-500'
                    : 'border-gray-200'
                }
                ${isOpen ? 'border-teal-500 ring-2 ring-teal-200' : ''}
              `}
              aria-expanded={isOpen}
              aria-haspopup="listbox"
              aria-label={
                locale === 'he'
                  ? 'בחר מדינה לקידומת'
                  : 'Select country for prefix'
              }
            >
              <span className="text-lg">{selectedCountry.flag}</span>
              <span className="text-sm font-medium truncate">
                {locale === 'he'
                  ? selectedCountry.nameHe
                  : selectedCountry.name}
              </span>
              <span className="text-xs text-gray-500 font-mono">
                ({selectedCountry.prefix})
              </span>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
          )}

          {/* Dropdown */}
          <AnimatePresence>
            {isOpen && !isManualPrefix && (
              <motion.div
                ref={dropdownRef}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full mt-1 left-0 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-96 overflow-hidden"
                role="listbox"
                aria-label={locale === 'he' ? 'רשימת מדינות' : 'Country list'}
              >
                {/* Search */}
                <div
                  className="p-3 border-b border-gray-100"
                  dir={locale === 'he' ? 'rtl' : 'ltr'}
                >
                  <div className="relative">
                    <Search
                      className={`absolute top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 ${locale === 'he' ? 'right-3' : 'left-3'}`}
                    />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder={
                        locale === 'he' ? 'חפש מדינה...' : 'Search country...'
                      }
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setIsOpen(false);
                          setSearchTerm('');
                        }
                      }}
                      className={`w-full py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-200 focus:border-teal-500 ${locale === 'he' ? 'pr-10 pl-8' : 'pl-10 pr-8'}`}
                    />
                    <AnimatePresence>
                      {searchTerm && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          type="button"
                          onClick={() => setSearchTerm('')}
                          className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 ${locale === 'he' ? 'left-3' : 'right-3'}`}
                        >
                          <X className="w-4 h-4" />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Manual prefix option */}
                <div
                  className="p-2 border-b border-gray-100"
                  dir={locale === 'he' ? 'rtl' : 'ltr'}
                >
                  <button
                    type="button"
                    onClick={enableManualPrefix}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span>
                      {locale === 'he'
                        ? 'הכנס קידומת בעצמך'
                        : 'Enter custom prefix'}
                    </span>
                  </button>
                </div>

                {/* Country list */}
                <div className="max-h-60 overflow-y-auto">
                  {sortedCountries.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500 text-center">
                      {locale === 'he'
                        ? 'לא נמצאו מדינות'
                        : 'No countries found'}
                    </div>
                  ) : (
                    sortedCountries.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => handleCountrySelect(country)}
                        role="option"
                        aria-selected={selectedCountry.code === country.code}
                        className={`
                          w-full flex items-center gap-3 px-4 py-3 text-sm
                          hover:bg-teal-50 transition-colors duration-150
                          ${
                            selectedCountry.code === country.code
                              ? 'bg-teal-100 text-teal-700'
                              : 'text-gray-700'
                          }
                        `}
                        dir="ltr"
                      >
                        <span className="text-lg">{country.flag}</span>
                        <span className="flex-1 text-left">
                          {locale === 'he' ? country.nameHe : country.name}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {country.prefix}
                        </span>
                        {country.popular && (
                          <span className="w-2 h-2 bg-teal-400 rounded-full" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Phone number input */}
        <div className="flex-1 relative">
          <input
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            disabled={disabled}
            placeholder={computedPlaceholder}
            aria-label={locale === 'he' ? 'מספר טלפון' : 'Phone number'}
            aria-invalid={!!error}
            className={`
              w-full pl-3 pr-10 py-3 border-2 rounded-xl
              transition-all duration-200 text-left
              ${
                disabled
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white hover:border-teal-300 focus:ring-2 focus:ring-teal-200 focus:border-teal-500'
              }
              ${
                error
                  ? 'border-red-400 focus:ring-red-200 focus:border-red-500'
                  : 'border-gray-200'
              }
            `}
            dir="ltr"
          />
          <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Error message with animation */}
      <AnimatePresence>
        {error && error.trim() && (
          <motion.p
            variants={errorVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`text-red-500 text-xs mt-2 ${locale === 'he' ? 'text-right' : 'text-left'}`}
            role="alert"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhoneNumberInput;
