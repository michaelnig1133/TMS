import React from 'react';
import { Link } from 'react-router-dom';

const PleaseLoginPage = () => {
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Oops! Please login to continue.</h1>
      <p>
        You need to be logged in to access this page. <br />
        <Link to="/">Go back to Home</Link>
      </p>
    </div>
  );
};

export default PleaseLoginPage;
