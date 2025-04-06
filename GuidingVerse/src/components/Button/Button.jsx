// --- Imports ---
import PropTypes from 'prop-types';
import styles from './Button.module.css';

/**
 * Reusable Button component with various variants and states
 * 
 * @param {Object} props
 * @param {string} [props.variant='primary'] - Visual style ('primary', 'secondary', 'outline', 'text')
 * @param {string} [props.size='medium'] - Button size ('small', 'medium', 'large')
 * @param {boolean} [props.fullWidth=false] - Whether the button takes full width
 * @param {boolean} [props.disabled=false] - Disabled state
 * @param {string} [props.type='button'] - HTML button type
 * @param {Function} [props.onClick] - Click handler
 * @param {React.ReactNode} props.children - Button content
 * @param {string} [props.className] - Additional class names
 */
function Button({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  type = 'button',
  onClick,
  children,
  className = '',
  ...rest
}) {
  // --- Style Logic ---
  // Combine base style with variant, size, and other conditional classes
  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    className
  ].filter(Boolean).join(' ');

  // --- JSX Structure ---
  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}

// --- Prop Types ---
Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'text']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

export default Button;