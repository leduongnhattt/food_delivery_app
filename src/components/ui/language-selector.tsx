"use client";

import { useTranslations } from '@/lib/i18n';

export function LanguageSelector() {
  const { locale, changeLocale } = useTranslations();

  const languages = [
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ] as const;

  return (
    <div className="flex items-center space-x-2">
      <select
        value={locale}
        onChange={(e) => changeLocale(e.target.value as 'vi' | 'en')}
        className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}
