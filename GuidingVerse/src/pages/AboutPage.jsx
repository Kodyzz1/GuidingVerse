// src/pages/AboutPage.jsx

// --- Component Definition ---
function AboutPage() {
  // --- JSX Structure ---
  return (
    <div className="about-container">
      <h1>About GuidingVerse</h1>
      
      <section className="mission-section">
        <h2>Our Mission</h2>
        <p>GuidingVerse was created with a simple mission: to make Bible study more accessible, engaging, and meaningful for everyone. We believe that Scripture is a guiding light for life&apos;s journey, and our aim is to provide tools that help you connect with its wisdom in today&apos;s digital world.</p>
      </section>
      
      <section className="story-section">
        <h2>Our Story</h2>
        <p>GuidingVerse began as a personal project by a small group of developers and Bible enthusiasts who wanted to create a modern, user-friendly Bible study application. What started as a simple Bible reader has grown into a platform designed to serve readers of all backgrounds and denominations.</p>
        <p>We launched GuidingVerse in 2024 with a focus on creating a distraction-free reading experience. As we grow, we continue to add features requested by our community while maintaining our commitment to simplicity and accessibility.</p>
      </section>
      
      <section className="values-section">
        <h2>Our Values</h2>
        <div className="values-grid">
          <div className="value-card">
            <h3>Accessibility</h3>
            <p>We believe Scripture should be accessible to everyone, regardless of technical ability or background. Our interface is designed to be intuitive and easy to use.</p>
          </div>
          
          <div className="value-card">
            <h3>Inclusivity</h3>
            <p>We respect diverse perspectives and denominations, providing a platform that welcomes all who seek to study Scripture, without imposing specific interpretations.</p>
          </div>
          
          <div className="value-card">
            <h3>Simplicity</h3>
            <p>In a world full of distractions, we value simplicity. Our reading experience focuses on the text itself, minimizing unnecessary features that might detract from engagement with Scripture.</p>
          </div>
          
          <div className="value-card">
            <h3>Privacy</h3>
            <p>Your spiritual journey is personal. We respect your privacy and limit data collection to only what&apos;s necessary to provide and improve our service.</p>
          </div>
        </div>
      </section>
      
      <section className="tech-section">
        <h2>Our Technology</h2>
        <p>GuidingVerse is built using modern web technologies that ensure a fast, reliable experience across devices. We use React for our frontend interface and Node.js for our backend services.</p>
        <p>Our Scripture database utilizes public domain texts and is constantly being improved for accuracy and readability. We&apos;re committed to maintaining the integrity of the biblical text while making it accessible in digital form.</p>
      </section>
      
      <section className="team-section">
        <h2>Our Team</h2>
        <p>GuidingVerse is developed and maintained by a small team of passionate individuals with backgrounds in software development, theology, and user experience design.</p>
        <p>We&apos;re always looking to grow our community and welcome contributions from those who share our vision.</p>
      </section>
      
      <section className="contact-section">
        <h2>Get in Touch</h2>
        <p>We value your feedback and suggestions. If you have questions, ideas, or would like to get involved, please contact us at:</p>
        <p className="contact-email">info@guidingverse.com</p>
      </section>
    </div>
  );
}

export default AboutPage;