import React from 'react';
import PropTypes from 'prop-types';
import styles from './LoadingSpinner.module.css';

/**
 * LoadingSpinner component that provides a consistent loading indicator
 * throughout the application.
 * 
 * @param {Object} props
 * @param {string} [props.size='medium'] - Size of the spinner ('small', 'medium', 'large')
 * @param {string} [props.color='primary'] - Color theme of the spinner ('primary', 'secondary', 'light')
 * @param {string} [props.message] - Optional message to display with the spinner
 * @param {boolean} [props.fullPage=false] - Whether the spinner should take the full page
 */
function LoadingSpinner({ size = 'medium', color = 'primary', message, fullPage = false }) {
  // Determine size class
  const sizeClass = styles[size] || styles.medium;
  
  // Determine color class
  const colorClass = styles[color] || styles.primary;
  
  // Determine container class
  const containerClass = fullPage ? styles.fullPage : styles.container;

  return (
    <div className={containerClass}>
      <div className={`${styles.spinner} ${sizeClass} ${colorClass}`}>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  color: PropTypes.oneOf(['primary', 'secondary', 'light']),
  message: PropTypes.string,
  fullPage: PropTypes.bool
};

export default LoadingSpinner;