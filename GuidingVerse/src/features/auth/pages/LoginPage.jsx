import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link for Signup prompt
import { useAuth } from '../../../contexts/AuthContext'; // Adjust path if needed

function LoginPage() {
  // State for form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // State for login errors

  // Get authentication functions and state from context
  const { login, isLoading, isAuthenticated } = useAuth();

  // Get navigation function
  const navigate = useNavigate();

  // Effect to redirect if user is already logged in
  useEffect(() => {
    if (isAuthenticated) {
      // Redirect to a default logged-in page, e.g., the reader or profile
      navigate('/reader');
      console.log("Already authenticated, redirecting..."); // For debugging
    }
  }, [isAuthenticated, navigate]);


  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default page reload
    setError(''); // Clear previous errors

    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      // Call the login function from AuthContext
      const success = await login(email, password);

      if (success) {
        // Redirect upon successful login (handled by AuthContext potentially,
        // but explicit navigation here is clear)
        // The useEffect above might also catch this state change and redirect
        navigate('/reader'); // Or user's dashboard/profile
      } else {
        // This else block might not be reached if login throws error on failure
        setError('Login failed. Please check your credentials.');
      }
    } catch (err) {
      // Handle errors thrown by the login function (when real API is implemented)
      console.error("Login error:", err); // Log the actual error
      // Set a generic error message, or use err.message if available
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  // Basic inline styles for demonstration
  const styles = {
    container: { maxWidth: '400px', margin: '2rem auto', padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' },
    formGroup: { marginBottom: '1rem' },
    label: { display: 'block', marginBottom: '0.5rem' },
    input: { width: '100%', padding: '0.5rem', boxSizing: 'border-box' },
    button: { padding: '0.75rem 1.5rem', cursor: 'pointer' },
    error: { color: 'red', marginTop: '1rem' },
    signupLink: { marginTop: '1rem', textAlign: 'center' }
  };

  return (
    <div style={styles.container}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label htmlFor="email" style={styles.label}>Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="password" style={styles.label}>Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        {error && <p style={styles.error}>{error}</p>}
        <button type="submit" disabled={isLoading} style={styles.button}>
          {isLoading ? 'Logging In...' : 'Login'}
        </button>
      </form>
       <div style={styles.signupLink}>
         <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
       </div>
    </div>
  );
}

export default LoginPage;