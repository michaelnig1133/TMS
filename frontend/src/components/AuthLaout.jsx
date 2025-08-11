import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import NavBar from './NavBar';
import Footer from './Footer';
const AuthLayout = () => {
  return (
    <div className="auth-layout">
      <NavBar/>
        <Outlet />
<Footer/>
    </div>
  );
};

export default AuthLayout;
