import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './LoginPage.module.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/reader');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event) => {
     event.preventDefault();
     setError('');
     if (!email || !password) {
       setError('Please enter both email and password.');
       return;
     }
     try {
       const success = await login(email, password);
       if (success) {
         navigate('/reader');
       } else {
         setError('Login failed. Please check your credentials.');
       }
     } catch (err) {
       setError(err.message || 'Login failed. Please try again.');
     }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Login</h2>
      <form onSubmit={handleSubmit}>
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
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" disabled={isLoading} className={styles.button}>
          {isLoading ? 'Logging In...' : 'Login'}
        </button>
      </form>
      <div className={styles.switchLink}>
        <p>Don&apos;t have an account? <Link to="/signup">Sign Up</Link></p>
      </div>
    </div>
  );
}

export default LoginPage;