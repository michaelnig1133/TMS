import React, { createContext, useContext, useState } from 'react';
const LanguageContext = createContext();
export const LanguageProvider = ({ children }) => {
  const [mylanguage, setLanguage] = useState('EN');
  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'EN' ? 'AM' : 'EN'));
  };
  return (
    <LanguageContext.Provider value={{ mylanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
  