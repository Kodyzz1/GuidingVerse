// src/pages/PrivacyPolicyPage.jsx
import React from 'react';

function PrivacyPolicyPage() {
  return (
    <div className="privacy-container">
      <h1>Privacy Policy</h1>
      
      <section>
        <h2>1. Information We Collect</h2>
        <p>GuidingVerse collects the following types of information:</p>
        <ul>
          <li><strong>Account Information:</strong> When you create an account, we collect your name, email address, and denomination preference.</li>
          <li><strong>Usage Data:</strong> We collect information about how you interact with our application, including reading history, bookmarks, and notes.</li>
          <li><strong>Device Information:</strong> We collect information about the device you use to access GuidingVerse, including device type, operating system, and browser type.</li>
        </ul>
      </section>
      
      <section>
        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, maintain, and improve GuidingVerse</li>
          <li>Personalize your experience</li>
          <li>Communicate with you about updates, features, and support</li>
          <li>Analyze usage patterns to enhance our service</li>
          <li>Protect against unauthorized access and other security issues</li>
        </ul>
      </section>
      
      <section>
        <h2>3. Information Sharing</h2>
        <p>We do not sell your personal information. We may share information with:</p>
        <ul>
          <li>Service providers who help us operate GuidingVerse</li>
          <li>Legal authorities when required by law</li>
          <li>Third parties in connection with a merger, acquisition, or sale of assets (with appropriate protections)</li>
        </ul>
      </section>
      
      <section>
        <h2>4. Data Security</h2>
        <p>We implement reasonable security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.</p>
      </section>
      
      <section>
        <h2>5. Your Rights and Choices</h2>
        <p>You can:</p>
        <ul>
          <li>Access, update, or delete your personal information through your account settings</li>
          <li>Opt out of promotional communications</li>
          <li>Request a copy of your data</li>
          <li>Close your account at any time</li>
        </ul>
      </section>
      
      <section>
        <h2>6. Cookies and Similar Technologies</h2>
        <p>GuidingVerse uses cookies and similar technologies to enhance your experience, analyze usage patterns, and deliver personalized content.</p>
      </section>
      
      <section>
        <h2>7. Children's Privacy</h2>
        <p>GuidingVerse is not directed to children under 13. We do not knowingly collect personal information from children under 13.</p>
      </section>
      
      <section>
        <h2>8. Changes to This Privacy Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new Privacy Policy on this page and updating the "Last updated" date.</p>
      </section>
      
      <section>
        <h2>9. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at privacy@guidingverse.com.</p>
      </section>
      
      <p className="privacy-footer">Last updated: April 5, 2025</p>
    </div>
  );
}

export default PrivacyPolicyPage;