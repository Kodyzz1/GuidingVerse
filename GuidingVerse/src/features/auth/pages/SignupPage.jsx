import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext'; // Adjust path if needed

// Define denomination options - you can expand this list
const denominationOptions = [
  "Non-denominational",
  "Baptist",
  "Catholic",
  "Methodist",
  "Lutheran",
  "Presbyterian",
  "Pentecostal",
  "Episcopalian/Anglican",
  "Orthodox",
  "Other",
  "Prefer not to say",
];

function SignupPage() {
  // State for form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [denomination, setDenomination] = useState(''); // State for selected denomination
  const [error, setError] = useState(''); // State for signup errors

  // Get authentication functions and state from context
  const { signup, isLoading, isAuthenticated } = useAuth();

  // Get navigation function
  const navigate = useNavigate();

  // Effect to redirect if user is already logged in
  useEffect(() => {
    if (isAuthenticated) {
      // Redirect to a default logged-in page
      navigate('/reader');
      console.log("Already authenticated, redirecting...");
    }
  }, [isAuthenticated, navigate]);

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(''); // Clear previous errors

    // Basic validation
    if (!name || !email || !password || !denomination) {
      setError('Please fill in all fields, including denomination.');
      return;
    }
    if (denomination === "") { // Ensure a real choice was made if using placeholder
        setError('Please select a denomination.');
        return;
    }

    try {
      // Call the signup function from AuthContext
      const success = await signup(name, email, password, denomination);

      if (success) {
        // Redirect upon successful signup (mock always succeeds)
        // Signup usually logs the user in, so redirect to main app area
        navigate('/reader');
      } else {
        setError('Signup failed. Please try again.');
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || 'Signup failed due to an error. Please try again.');
    }
  };

  // Basic inline styles (consistent with LoginPage)
  const styles = {
    container: { maxWidth: '450px', margin: '2rem auto', padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' },
    formGroup: { marginBottom: '1rem' },
    label: { display: 'block', marginBottom: '0.5rem' },
    input: { width: '100%', padding: '0.5rem', boxSizing: 'border-box' },
    select: { width: '100%', padding: '0.5rem', boxSizing: 'border-box' }, // Style for select
    button: { padding: '0.75rem 1.5rem', cursor: 'pointer', marginTop: '1rem' },
    error: { color: 'red', marginTop: '1rem' },
    loginLink: { marginTop: '1rem', textAlign: 'center' }
  };

  return (
    <div style={styles.container}>
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label htmlFor="name" style={styles.label}>Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={styles.input}
          />
        </div>
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
        <div style={styles.formGroup}>
          <label htmlFor="denomination" style={styles.label}>Denomination:</label>
          <select
            id="denomination"
            value={denomination}
            onChange={(e) => setDenomination(e.target.value)}
            required
            style={styles.select}
          >
            <option value="" disabled>-- Select Denomination --</option>
            {denominationOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" disabled={isLoading} style={styles.button}>
          {isLoading ? 'Signing Up...' : 'Sign Up'}
        </button>
      </form>
      <div style={styles.loginLink}>
        <p>Already have an account? <Link to="/login">Log In</Link></p>
      </div>
    </div>
  );
}

export default SignupPage;