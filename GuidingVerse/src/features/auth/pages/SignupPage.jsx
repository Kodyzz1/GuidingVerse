// --- Imports ---
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
// TODO: Ensure SignupPage.module.css exists and contains necessary styles
import styles from './SignupPage.module.css';

// --- Constants ---
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

// --- Component Definition ---
function SignupPage() {
  // --- State ---
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [denomination, setDenomination] = useState('');
  const [error, setError] = useState('');
  const { signup, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // --- Effect (Redirect if already authenticated) ---
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/reader');
    }
  }, [isAuthenticated, navigate]);

  // --- Handlers ---
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!name || !email || !password || !denomination) {
      setError('Please fill in all fields, including denomination.');
      return;
    }
    if (denomination === "") {
        setError('Please select a denomination.');
        return;
    }

    try {
      const success = await signup(name, email, password, denomination);
      if (success) {
        navigate('/reader');
      } else {
        setError('Signup failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Signup failed due to an error. Please try again.');
    }
  };

  // --- JSX Structure ---
  return (
    <div className={styles.container}>
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="name" className={styles.label}>Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.label}>Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="denomination" className={styles.label}>Denomination:</label>
          <select
            id="denomination"
            value={denomination}
            onChange={(e) => setDenomination(e.target.value)}
            required
            className={styles.select}
          >
            <option value="" disabled>-- Select Denomination --</option>
            {denominationOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" disabled={isLoading} className={styles.button}>
          {isLoading ? 'Signing Up...' : 'Sign Up'}
        </button>
      </form>
      <div className={styles.switchLink}>
        <p>Already have an account? <Link to="/login">Log In</Link></p>
      </div>
    </div>
  );
}

export default SignupPage;