import React from 'react';
import { SUPPORTED_LANGUAGES } from '../constants';
import { LanguageOption } from '../types';

interface LanguageDropdownProps {
  selectedLanguage: LanguageOption;
  onChange: (lang: LanguageOption) => void;
  disabled: boolean;
}

const LanguageDropdown: React.FC<LanguageDropdownProps> = ({ selectedLanguage, onChange, disabled }) => {
  return (
    <div className="relative group">
      <select
        value={selectedLanguage.code}
        onChange={(e) => {
          const lang = SUPPORTED_LANGUAGES.find(l => l.code === e.target.value);
          if (lang) onChange(lang);
        }}
        disabled={disabled}
        className="appearance-none bg-slate-700/50 hover:bg-slate-700 text-white font-medium pl-3 pr-8 py-1.5 rounded-lg border border-transparent hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-slate-800 text-white">
            {lang.nativeName}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

export default LanguageDropdown;