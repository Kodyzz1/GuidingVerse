// src/pages/HowItWorksPage.jsx
import React from 'react';

function HowItWorksPage() {
  return (
    <div className="how-it-works-container">
      <h1>How GuidingVerse Works</h1>
      
      <section className="intro-section">
        <p>GuidingVerse is designed to make Bible study accessible, personal, and meaningful. Here's how you can get the most out of our platform:</p>
      </section>
      
      <section className="feature-section">
        <h2>1. Bible Reader</h2>
        <div className="feature-content">
          <div className="feature-text">
            <p>Our Bible reader provides clear, easy-to-navigate access to Scripture:</p>
            <ul>
              <li>Simple book and chapter selection</li>
              <li>Clean, distraction-free reading interface</li>
              <li>Proper formatting of verses and italicized words</li>
              <li>King James Version text with more translations coming soon</li>
            </ul>
          </div>
          <div className="feature-image">
            {/* Image placeholder */}
            <div className="image-placeholder">Bible Reader Screenshot</div>
          </div>
        </div>
      </section>
      
      <section className="feature-section">
        <h2>2. Personal Account</h2>
        <div className="feature-content">
          <div className="feature-text">
            <p>Create a free account to enhance your study experience:</p>
            <ul>
              <li>Save your reading preferences</li>
              <li>Bookmark favorite passages</li>
              <li>Track your reading progress</li>
              <li>Customize your study experience based on your denomination</li>
            </ul>
          </div>
          <div className="feature-image">
            {/* Image placeholder */}
            <div className="image-placeholder">Account Features Screenshot</div>
          </div>
        </div>
      </section>
      
      <section className="feature-section">
        <h2>3. Study Tools (Coming Soon)</h2>
        <div className="feature-content">
          <div className="feature-text">
            <p>We're developing additional tools to deepen your study:</p>
            <ul>
              <li>Personal notes and highlighting</li>
              <li>Cross-references and parallel passages</li>
              <li>Word studies and definitions</li>
              <li>Historical context and commentary</li>
              <li>Reading plans and devotionals</li>
            </ul>
          </div>
          <div className="feature-image">
            {/* Image placeholder */}
            <div className="image-placeholder">Study Tools Preview</div>
          </div>
        </div>
      </section>
      
      <section className="getting-started">
        <h2>Getting Started</h2>
        <ol>
          <li><strong>Create an account</strong> - Sign up with your email to access all features</li>
          <li><strong>Select a passage</strong> - Choose any book and chapter from the Bible</li>
          <li><strong>Start reading</strong> - Enjoy a clean, focused reading experience</li>
          <li><strong>Save your progress</strong> - Your place will be remembered for next time</li>
        </ol>
      </section>
      
      <section className="technical-info">
        <h2>Technical Information</h2>
        <p>GuidingVerse works on all modern devices and browsers. The application is designed to be lightweight and fast, even on slower connections.</p>
        <p>Bible text is loaded on demand, meaning you don't need to download the entire Bible to start reading.</p>
      </section>
      
      <div className="cta-section">
        <h2>Ready to begin?</h2>
        <p>Start your Bible study journey today with GuidingVerse.</p>
        <div className="cta-buttons">
          <a href="/signup" className="primary-button">Sign Up</a>
          <a href="/reader" className="secondary-button">Try the Reader</a>
        </div>
      </div>
    </div>
  );
}

export default HowItWorksPage;