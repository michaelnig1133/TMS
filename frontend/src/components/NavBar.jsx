import React, { useState, useEffect, useRef } from 'react';
import Logo from '../assets/Logo.jpg';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from "../context/ThemeContext";
import { motion } from 'framer-motion';
import LoginModal from './LoginModal';
import { 
  FaHome, 
  FaTools, 
  FaInfoCircle, 
  FaEnvelope,
  FaLanguage,
  FaCog
} from 'react-icons/fa';
import { IoIosLogIn } from "react-icons/io";
import { GiHamburgerMenu } from "react-icons/gi";
import { MdDarkMode } from "react-icons/md";
import { LuSunMedium } from "react-icons/lu";
import '../index.css';

const NavBar = ({ homeRef, servicesRef, whyTMSRef, emailFormRef }) => {
  const { mylanguage, toggleLanguage } = useLanguage();
  const { myTheme, toggleTheme } = useTheme();
  const [showLogin, setShowLogin] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef(null);

  // Handle click outside settings menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [settingsRef]);

  const scrollToSection = (sectionRef, section) => {
    sectionRef.current.scrollIntoView({ behavior: 'smooth' });
    setActiveSection(section);
  };

  const logoVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
  };

  const linkVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  };

  // Map sections to their respective icons and translations
  const navLinks = [
    { section: 'home', ref: homeRef, icon: <FaHome />, amharic: 'መግቢያ' },
    { section: 'services', ref: servicesRef, icon: <FaTools />, amharic: 'አገልግሎቶች' },
    { section: 'about', ref: whyTMSRef, icon: <FaInfoCircle />, amharic: 'ስለ እኛ' },
    { section: 'contact', ref: emailFormRef, icon: <FaEnvelope />, amharic: 'እኛን እንደምን ደርሶ' },
  ];

  return (
    <div className={`mynav ${myTheme === "dark" ? "dark" : "light"}`}>
      <nav className={`navbar navbar-expand-lg fixed-top ${myTheme === "dark" ? "dark" : "light"}`}>
        <div className="container-fluid d-flex">
          <motion.a 
            className="navbar-brand" 
            href="/"
            initial="hidden"
            animate="visible"
            variants={logoVariants}
          >
            <img src={Logo} alt="Logo" />
          </motion.a>
          
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <GiHamburgerMenu color='#F09F33' />
          </button>
          
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
              <section className="navs">
                {navLinks.map(({ section, ref, icon, amharic }, index) => (
                  <motion.li
                    key={section}
                    className="nav-item"
                    initial="hidden"
                    animate="visible"
                    variants={linkVariants}
                    transition={{ delay: index * 0.2 }}
                  >
                    <a
                      className={`nav-link ${activeSection === section ? 'active' : ''}`}
                      href="#"
                      onClick={() => scrollToSection(ref, section)}
                      style={{
                        color: myTheme === 'dark' ? '#B3A2F0' : '#106374',
                      }}
                    >
                      {icon}
                      {mylanguage === 'EN'
                        ? section.charAt(0).toUpperCase() + section.slice(1)
                        : amharic}
                    </a>
                  </motion.li>
                ))}
                
                {/* Settings Dropdown */}
                <motion.li
                  className="nav-item settings-dropdown"
                  initial="hidden"
                  animate="visible"
                  variants={linkVariants}
                  ref={settingsRef}
                >
                  <button 
                    className="settings-icon"
                    onClick={() => setShowSettings(!showSettings)}
                    style={{
                      color: myTheme === 'dark' ? '#B3A2F0' : '#106374',
                    }}
                  >
                    <FaCog size={18} />
                  </button>
                  
                  <div 
                    className={`settings-menu ${myTheme === 'dark' ? 'dark' : 'light'} ${showSettings ? 'show' : ''}`}
                  >
                    <div 
                      className={`settings-item ${myTheme === 'dark' ? 'dark' : 'light'}`}
                      onClick={toggleLanguage}
                      style={{
                        color: myTheme === 'dark' ? '#B3A2F0' : '#106374',
                      }}
                    >
                      <FaLanguage size={16} />
                      {mylanguage === 'EN' ? 'አማርኛ' : 'English'}
                    </div>
                    
                    <div 
                      className={`settings-item ${myTheme === 'dark' ? 'dark' : 'light'}`}
                      onClick={toggleTheme}
                      style={{
                        color: myTheme === 'dark' ? '#B3A2F0' : '#106374',
                      }}
                    >
                      {myTheme === 'dark' ? <LuSunMedium size={16} /> : <MdDarkMode size={16} />}
                      {myTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </div>
                  </div>
                </motion.li>
              </section>
            </ul>
            
            <motion.button
              className="login-btn"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              onClick={() => setShowLogin(true)}
            >
              {mylanguage === 'EN' ? 'Login' : 'መግቢያ'}
              
            </motion.button>
          </div>
        </div>
      </nav>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
};

export default NavBar;