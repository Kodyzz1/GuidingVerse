// src/pages/NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="not-found-container">
      <h1>404 - Page Not Found</h1>
      
      <div className="not-found-content">
        <p className="not-found-message">
          "Seek, and ye shall find; knock, and it shall be opened unto you." - Matthew 7:7
        </p>
        
        <p>
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="not-found-suggestions">
          <h2>You might want to:</h2>
          <ul>
            <li>Double-check the URL for typos</li>
            <li>Return to the <Link to="/">home page</Link></li>
            <li>Go to the <Link to="/reader">Bible reader</Link></li>
            <li>Contact us if you believe this is an error</li>
          </ul>
        </div>
        
        <div className="not-found-navigation">
          <h3>Quick Navigation</h3>
          <div className="nav-buttons">
            <Link to="/" className="primary-button">Home</Link>
            <Link to="/reader" className="secondary-button">Bible Reader</Link>
            <Link to="/about" className="secondary-button">About</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;