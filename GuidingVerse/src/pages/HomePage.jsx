// --- Imports ---
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './HomePage.module.css';

// --- Component Definition ---
function HomePage() {
  const { isAuthenticated } = useAuth();
  
  // --- JSX Structure ---
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Journey Through Scripture with GuidingVerse</h1>
          <p className="hero-subtitle">
            A modern Bible study companion designed for clarity, focus, and spiritual growth
          </p>
          <div className="hero-buttons">
            {isAuthenticated ? (
              <Link to="/reader" className="primary-button">Open Bible Reader</Link>
            ) : (
              <>
                <Link to="/signup" className="primary-button">Start Your Journey</Link>
                <Link to="/reader" className="secondary-button">Try Reader</Link>
              </>
            )}
          </div>
        </div>
        <div className="hero-image">
          <div className="image-placeholder">
            {/* This would be replaced with a real image */}
            Bible Study Illustration
          </div>
        </div>
      </section>
      
      {/* Features Overview Section */}
      <section className="features-section">
        <h2 className="section-title">Why Choose GuidingVerse?</h2>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📖</div>
            <h3>Clear Reading Experience</h3>
            <p>Distraction-free interface designed for comfortable reading of Scripture with proper formatting and verse navigation.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Simple Navigation</h3>
            <p>Easily find and navigate to any book, chapter, or verse with our intuitive selection tools.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔄</div>
            <h3>Sync Across Devices</h3>
            <p>Your reading progress, bookmarks, and notes sync seamlessly across all your devices.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">✝️</div>
            <h3>Denomination Aware</h3>
            <p>Customize your experience based on your denomination for a more relevant study experience.</p>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="testimonials-section">
        <h2 className="section-title">What Our Users Say</h2>
        
        <div className="testimonials-container">
          <div className="testimonial-card">
            <p className="testimonial-text">&quot;GuidingVerse has transformed my daily devotional time. The clean interface helps me focus on Scripture without distractions.&quot;</p>
            <p className="testimonial-author">— Sarah K.</p>
          </div>
          
          <div className="testimonial-card">
            <p className="testimonial-text">&quot;I appreciate how GuidingVerse respects different denominational traditions while keeping the focus on Scripture itself.&quot;</p>
            <p className="testimonial-author">— Michael T.</p>
          </div>
          
          <div className="testimonial-card">
            <p className="testimonial-text">&quot;The ability to access my Bible study notes across all my devices has been a game-changer for my small group leadership.&quot;</p>
            <p className="testimonial-author">— Pastor James</p>
          </div>
        </div>
      </section>
      
      {/* Scripture of the Day */}
      <section className="scripture-section">
        <h2 className="section-title">Scripture of the Day</h2>
        <div className="scripture-card">
          <p className="scripture-text">&quot;Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.&quot;</p>
          <p className="scripture-reference">— Proverbs 3:5-6 (KJV)</p>
        </div>
      </section>
      
      {/* Getting Started Section */}
      <section className="getting-started-section">
        <h2 className="section-title">Begin Your Scripture Journey Today</h2>
        <p className="section-subtitle">Create a free account to unlock the full GuidingVerse experience</p>
        
        <div className="steps-container">
          <div className="step-item">
            <div className="step-number">1</div>
            <h3>Create an Account</h3>
            <p>Sign up for free to save your preferences and progress</p>
          </div>
          
          <div className="step-item">
            <div className="step-number">2</div>
            <h3>Choose a Passage</h3>
            <p>Navigate to any book or chapter in the Bible</p>
          </div>
          
          <div className="step-item">
            <div className="step-number">3</div>
            <h3>Start Reading</h3>
            <p>Enjoy a clean, focused reading experience</p>
          </div>
        </div>
        
        <div className="cta-container">
          {isAuthenticated ? (
            <Link to="/reader" className="primary-button large">Open Bible Reader</Link>
          ) : (
            <Link to="/signup" className="primary-button large">Create Free Account</Link>
          )}
        </div>
      </section>
      
      {/* Future Features */}
      <section className="coming-soon-section">
        <h2 className="section-title">Coming Soon</h2>
        
        <div className="coming-soon-grid">
          <div className="coming-soon-card">
            <h3>Study Notes</h3>
            <p>Add personal notes to verses and chapters</p>
          </div>
          
          <div className="coming-soon-card">
            <h3>Reading Plans</h3>
            <p>Follow guided reading plans for spiritual growth</p>
          </div>
          
          <div className="coming-soon-card">
            <h3>Verse Highlighting</h3>
            <p>Highlight and categorize important passages</p>
          </div>
          
          <div className="coming-soon-card">
            <h3>Additional Translations</h3>
            <p>More Bible translations coming soon</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;