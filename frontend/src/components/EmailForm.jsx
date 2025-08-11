import React, { useRef } from 'react';
import emailjs from '@emailjs/browser';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap
import "../index.css";
import { useLanguage } from '../context/LanguageContext'; // Importing context
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import Toastify styles
import { useTheme } from '../context/ThemeContext';
const EmailForm = () => {
  const { mylanguage } = useLanguage(); 
  const {myTheme} = useTheme(); // Access the current language from context
  const form = useRef();

  // Toast notification
  const notify = (senderName) => toast.success(`${mylanguage==="EN"?"Your message has been sent successfully!":"መልእክቶ በተሳካ ሁኒታተል"}`);

  const sendEmail = (e) => {
    e.preventDefault();

    const userName = form.current.user_name.value; // Get the sender's name from the form

    emailjs
      .sendForm('service_cf5gngo', 'template_0aua8iv', form.current, {
        publicKey: 'DYWJ0edl9oKjFT5mp',
      })
      .then(
        () => {
          // Show toast on successful email send
          notify(userName);
          console.log('SUCCESS!');
        },
        (error) => {
          console.log('FAILED...', error.text);
        },
      );
  };

  return (
    <div className={`container-fluid py-4 ${myTheme === "dark"?"dark":"light"} full`}>
    

      {/* Header Section */}
      <h2 className="text-center mb-3">
        {mylanguage === 'EN' ? 'Get in Touch' : 'ወደ ዳሰሳ ሂድ'}
      </h2>
      <p className={`text-center text-muted mb-4 ${myTheme === "dark"?"dark":"light"}`}>
        {mylanguage === 'EN' ? 'We are here for you! How can we help?' : 'እኛ ለእርስዎ እዚህ ነን! እንዴት ልርዳችሁ እንችላለን?'}
      </p>
      <form ref={form} onSubmit={sendEmail} className="mx-auto emailform" style={{ maxWidth: '500px' }}>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">
            {mylanguage === 'EN' ? 'Name' : 'ስም'}
          </label>
          <input
  type="text"
  name="user_name"
  className={`form-control ${myTheme === "dark" ? "dark-theme-input" : ""}`}
  id="name"
  placeholder={mylanguage === 'EN' ? 'Name' : 'ስም'}
  required
/>
        </div>

        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            {mylanguage === 'EN' ? 'Email' : 'ኢሜል'}
          </label>
          <input
  type="email"
  name="user_email"
  className={`form-control ${myTheme === "dark" ? "dark-theme-input" : ""}`}
  id="email"
  placeholder={mylanguage === 'EN' ? 'Email' : 'ኢሜል'}
  required
/>
        </div>

        <div className="mb-3">
          <label htmlFor="message" className="form-label">
            {mylanguage === 'EN' ? 'Message' : 'መልእክት'}
          </label>
          <textarea
  name="message"
  className={`form-control ${myTheme === "dark" ? "dark-theme-input" : ""}`}
  id="message"
  rows="4"
  placeholder={mylanguage === 'EN' ? 'Message' : 'መልእክት'}
  required
></textarea>
        </div>

        <div className="d-flex justify-content-center">
          <button type="submit" className="btn-custom">
            {mylanguage === 'EN' ? 'Submit' : 'ላክ'}
          </button>
        </div>
      </form>
      <ToastContainer />
    </div>
  );
};

export default EmailForm;
