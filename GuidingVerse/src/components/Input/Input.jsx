// --- Imports ---
import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import styles from './Input.module.css';

/**
 * Reusable Input component with various states and options
 * 
 * @param {Object} props
 * @param {string} props.id - Input ID (required for label association)
 * @param {string} [props.type='text'] - Input type
 * @param {string} [props.label] - Label text
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.value] - Input value
 * @param {Function} [props.onChange] - Change handler
 * @param {boolean} [props.required=false] - Whether the input is required
 * @param {boolean} [props.disabled=false] - Whether the input is disabled
 * @param {string} [props.error] - Error message
 * @param {string} [props.helpText] - Help text to display
 * @param {string} [props.className] - Additional class names
 */
const Input = forwardRef(({
  id,
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  error,
  helpText,
  className = '',
  ...rest
}, ref) => {
  // --- Style Logic ---
  const hasError = !!error;
  const inputClasses = [
    styles.input,
    hasError ? styles.error : '',
    disabled ? styles.disabled : '',
    className
  ].filter(Boolean).join(' ');

  // --- JSX Structure ---
  return (
    <div className={styles.formGroup}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </label>
      )}
      
      <input
        ref={ref}
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={inputClasses}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : helpText ? `${id}-help` : undefined}
        {...rest}
      />
      
      {helpText && !hasError && (
        <p id={`${id}-help`} className={styles.helpText}>
          {helpText}
        </p>
      )}
      
      {hasError && (
        <p id={`${id}-error`} className={styles.errorText} role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

// --- Display Name ---
Input.displayName = 'Input';

// --- Prop Types ---
Input.propTypes = {
  id: PropTypes.string.isRequired,
  type: PropTypes.string,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  helpText: PropTypes.string,
  className: PropTypes.string
};

export default Input;