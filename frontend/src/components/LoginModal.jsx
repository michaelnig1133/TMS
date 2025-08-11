import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SignupModal from './SignupModal';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import operation from "../assets/CarImg.jpg";
import { IoClose, IoEye, IoEyeOff } from "react-icons/io5";  
import { ENDPOINTS } from '../utilities/endpoints';
import { useAuth } from '../context/AuthContext';

const LoginModal = ({ onClose }) => {
  const { login } = useAuth();

  const [showSignup, setShowSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);  
  const { mylanguage } = useLanguage();
  const { myTheme } = useTheme();
  const navigate = useNavigate();
  const emailInputRef = useRef(null);

  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, []);

  if (showSignup) {
    return <SignupModal onClose={() => setShowSignup(false)} />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(ENDPOINTS.LOGIN, {
        email,
        password,
      });

      const { access } = response.data;
      login(access);
      
      localStorage.setItem('authToken', access);
      const decodedToken = jwtDecode(access);
      onClose();

      if (decodedToken.role === 1) {
        navigate('/employee');
      } else if (decodedToken.role === 2) {
        navigate('/department-manager/vehicle-request');
      } else if (decodedToken.role === 3) {
        navigate('/finance-manager/refueling');
      } else if (decodedToken.role === 4) {
        navigate('/transport-manager/dashbord');
      } else if (decodedToken.role === 5) {
        navigate('/ceo/dashbord');
      } else if (decodedToken.role === 6) {
        navigate('/driver/high-cost-schedule');
      } else if (decodedToken.role === 7) {
        navigate('/admin/admin');
      } else if (decodedToken.role === 8) {
        navigate('/general-service/refueling'); 
      } else if (decodedToken.role === 9) {
        navigate('/budget-manager/high_cost'); 
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(
        mylanguage === 'EN'
          ? 'Invalid email or password. Please try again.'
          : 'የተሳሳተ ኢሜል ወይም ፓስወርድ። እባኮትን እንደገና ይሞክሩ።'
      );
    }
  };

  return (
    <div className="modal-overlay">
      <div className={`login-modal ${myTheme === 'dark' ? 'dark' : 'light'}`}>
        {/* Left side image container */}
        <div className="image-container">
          <img src={operation} alt="Login" className="full-height-image" />
        </div>

        {/* Right side form container */}
        <div className="form-container">
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleLogin}>
            <button className="btn-close mb-5" onClick={onClose} type="button"><IoClose size={30} /></button>
            <h1 className="text-center mb-4">
              {mylanguage === 'EN' ? 'Login' : 'መግቢያ'}
            </h1>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                {mylanguage === 'EN' ? 'Email Address' : 'የኢሜል አድራሻ'}
              </label>
              <input
                type="email"
                className="form-control"
                id="email"
                placeholder={mylanguage === 'EN' ? 'Your email address' : 'የኢሜል አድራሻዎን ያስገቡ'}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                ref={emailInputRef}
              />
            </div>


            <div className="mb-3 position-relative">
              <label htmlFor="password" className="form-label">
                {mylanguage === 'EN' ? 'Password' : 'ፓስወርድ'}
              </label>
              <input
                type={passwordVisible ? 'text' : 'password'}
                className="form-control"
                id="password"
                placeholder={mylanguage === 'EN' ? 'Your password' : 'ፓስወርድዎን ያስገቡ'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span
                className="password-toggle"
                onClick={() => setPasswordVisible(!passwordVisible)}
                style={{ position: 'absolute', top: '70%', right: '10px', cursor: 'pointer', transform: 'translateY(-50%)' }}
              >
                {passwordVisible ? <IoEyeOff size={20} /> : <IoEye size={20} />}
              </span>
            </div>

            <button
              type="submit"
              className="btn w-100 login-btn"
              style={{ backgroundColor: '#F09F33', color: 'white' }}
              disabled={!email || !password}
            >
              {mylanguage === 'EN' ? 'Login' : 'ይግቡ'}
            </button>
          </form>

          <div className="text-center mt-3 d-flex">
            <pre>{mylanguage === 'EN' ? "Don't have an account?" : 'አካዉንት የሎትም?'}</pre>
            <a href="#" className="text-decoration-none signup" onClick={() => setShowSignup(true)}>
              {mylanguage === 'EN' ? 'Sign Up' : 'ይመዝገቡ'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;