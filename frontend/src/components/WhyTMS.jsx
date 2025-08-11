import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import cost from '../assets/cost.jpg';
import time from '../assets/time.jpg';
import Operational from '../assets/Operational.jpg';
import Utilization from '../assets/Utilization.jpg';
import Compatibility from '../assets/Compatibility.jpg';
import Language from '../assets/Language.jpg';

const WhyTMS = ({whyTMSRef}) => {
  const { mylanguage } = useLanguage(); // Access the current language context
  const { myTheme } = useTheme();

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
    hover: { scale: 1.05, boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.2)", transition: { duration: 0.3 } },
  };

  const cardData = [
    {
      titleEN: 'Optimize Fleet Utilization',
      titleLocal: 'የተሽከርካሪ እንቅስቃሴን ያስተካክሉ',
      textEN: 'Maximize vehicle usage with centralized scheduling, real-time tracking, and improved management.',
      textLocal: 'በተሰበሰበ መርሀ ግብር፣ በሰሜን ጊዜ እንቅስቃሴ እና የተሻለ አስተዳደር የተሽከርካሪ እንቅስቃሴን አብዝበው ይጠቀሙ።',
      icon: Utilization,
    },
    {
      titleEN: 'Enhance Operational Efficiency',
      titleLocal: 'የሥራ እድሜን አብዛቡ',
      textEN: 'Reduce time spent on administrative tasks through automated workflows and streamlined approvals.',
      textLocal: 'በተሠሩ የሥራ አሰራሮችና የተሻለ ማጽደቅ ሥርዓት ላይ የሚከፈል ጊዜን አሳልፉ።',
      icon: Operational,
    },
    {
      titleEN: 'Reduce Costs',
      titleLocal: 'ወጪዎችን አንሳስ',
      textEN: 'Lower operational expenses with advanced data analysis and preventive maintenance scheduling to avoid unexpected repairs and downtime.',
      textLocal: 'ከቀድሞው ይልቅ በሰላም የመጠቀምና እንቅስቃሴን እንዳይወጣ በተሻለ የመረጃ ትንተና ያንሳሉ።',
      icon: cost,
    },
    {
      titleEN: '24/7 Availability',
      titleLocal: '24/7 በማንኛውም ቦታ ምንም ጊዜ አገልግሎት',
      textEN: 'Access the system anytime, anywhere, ensuring continuous operations and support no matter where you are.',
      textLocal: 'እንቅስቃሴዎችን በማንኛውም ጊዜና ቦታ ያስቀጥሉ፣ ምንም ሁኔታ እንኳን የቀጥታ አገልግሎትን ያግኙ።',
      icon: time,
    },
    {
      titleEN: 'Works on Any Device',
      titleLocal: 'በማንኛውም መሣሪያ ላይ ይሰራል',
      textEN: 'Seamlessly access the system on mobile phones, tablets, or desktops, ensuring flexibility and convenience.',
      textLocal: 'ክብደት እና ተመጣጣኝነት እንዲሆን ስርዓቱን በስልክ፣ በታብሌት፣ ወይም በዴስክቶፕ ላይ በቀላሉ ያግኙ።',
      icon: Compatibility,
    },
    {
      titleEN: 'Seamless Multilingual Experience',
      titleLocal: 'በቀላሉ የቋንቋ ተስማማት ልምድ',
      textEN: 'Our system supports both Amharic and English, enabling better understanding and communication for employers and employees alike.',
      textLocal: 'ስርዓታችን አማርኛና እንግሊዝኛን በማካተት ለተቀጣሪዎችና ሥራ አስኪያጅ አቅርቦትን እና መረዳትን ያበረታታል።',
      icon: Language,
    },
  ];

  return (
    <div ref={whyTMSRef} id="about">
<div className={`container-fluid py-5 px-5 ${myTheme==="dark" ? "dark" : "light"}`}>
<h2 
        className="d-flex justify-content-center" 
        id="texthero2"
        style={{
          color: myTheme === "dark" ? "#B3A2F0" : "#106374", 
        }}
      >
        {mylanguage === 'EN' 
          ? 'Why TMS' 
          : 'እኛ ምርጥ አገልግሎቶችን እናቀርባለን'}
      </h2>
      <br />
      <br />
      <br />
      <motion.div
        className="row g-4 justify-content-center"
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.2 }}
      >
        {cardData.map(({ titleEN, titleLocal, textEN, textLocal, icon }, index) => (
          <motion.div
            key={index}
            className="col-12 col-sm-6 col-lg-4 d-flex justify-content-center"
            variants={cardVariants}
            whileHover="hover"
          >
            <div
              className="card text-center"
              style={{
                width: '100%',
                backgroundColor: myTheme === 'dark' ? '#4D6373' : '#FFFFFF',
                color: myTheme === 'dark' ? '#C1C1C2' : '#181E4B',
              }}
            >
              <img
                src={icon}
                alt={mylanguage === 'EN' ? titleEN : titleLocal}
                className="card-img-top"
                style={{ height: '200px', objectFit: 'cover' }}
              />
              <div className="card-body">
                <h5 className="card-title">
                  {mylanguage === 'EN' ? titleEN : titleLocal}
                </h5>
                <p className="card-text">
                  {mylanguage === 'EN' ? textEN : textLocal}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
    </div>
  );
};

export default WhyTMS;
