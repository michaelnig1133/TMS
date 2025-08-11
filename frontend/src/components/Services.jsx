import React from 'react';
import ServiceCard from './ServiceCard';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import "../index.css";

const Services = ({ servicesRef }) => {
  const { mylanguage } = useLanguage();
  const { myTheme } = useTheme();

  return (
    <div 
      ref={servicesRef} 
      id="services" 
      className={`services-container ${myTheme === "dark" ? "dark" : ""}`}
    >
      <h2 className="services-title">
        {mylanguage === 'EN' 
          ? 'We Offer Best Services' 
          : 'እኛ ምርጥ አገልግሎቶችን እናቀርባለን'}
      </h2>
      <ServiceCard />
    </div>
  );
};

export default Services;