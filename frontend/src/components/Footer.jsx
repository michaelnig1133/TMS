import React from 'react';
import { motion } from 'framer-motion';
import { FaFacebook, FaYoutube, FaLinkedin, FaTelegram } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';

const Footer = ({  homeRef, servicesRef, whyTMSRef, emailFormRef,myTheme }) => {
  const { mylanguage } = useLanguage(); // Access language context

  const scrollToSection = (sectionRef) => {
    if (sectionRef?.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  const linkVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
  };
  return (
    <footer className="footer">
      <div className="footer-content">
        {/* Social Media Links */}
        <div className="flex">
          <div className="one">
            <div className="copyright">
              © {new Date().getFullYear()} MiNT Solutions. All rights reserved.
            </div>
            <div className="social-links">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                <FaFacebook size={30} />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                <FaYoutube size={30} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                <FaLinkedin size={30} />
              </a>
              <a href="https://telegram.org" target="_blank" rel="noopener noreferrer">
                <FaTelegram size={30} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="quick-links">
            <ul>
              {[
                { section: 'home', ref: homeRef },
                { section: 'services', ref: servicesRef },
                { section: 'about', ref: whyTMSRef },
                { section: 'contact', ref: emailFormRef },
              ].map(({ section, ref }, index) => (
                <motion.li
                  key={section}
                  className="nav-item"
                  initial="hidden"
                  animate="visible"
                  variants={linkVariants}
                  transition={{ delay: index * 0.1 }}
                >
                  <a
                    className="nav-link"
                    href="#"
                    onClick={() => scrollToSection(ref)}
                    style={{
                      color: myTheme === 'dark' ? '#B3A2F0' : '#fff',
                      fontSize: '20px',
                    }}
                  >
                    {mylanguage === 'EN'
                        ? section.charAt(0).toUpperCase() + section.slice(1)
                        : section === 'home'
                        ? 'መግቢያ'
                        : section === 'services'
                        ? 'አገልግሎቶች'
                        : section === 'about'
                        ? 'ስለ እኛ'
                        : 'እኛን እንደምን ደርሶ'}
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>
          <div className="philosophy">
            <h4 style={{ color: '#F09F33' }}>
              {mylanguage === 'EN' ? 'Our Philosophy' : 'ፍልስፍናችን'}
            </h4>
            <p>
              {mylanguage === 'EN' ? (
                <>
                  We believe in innovation and technology to create <br />
                  sustainable solutions for a better tomorrow.
                </>
              ) : (
                'እኛ በኢኖቬሽንና ቴክኖሎጂ ላይ እንምናለን እና ለወደፊት ቀላል የሆኑ መፍትሄዎችን እንፈጥራለን።'
              )}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
