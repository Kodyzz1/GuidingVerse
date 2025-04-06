// src/components/Modal/Modal.jsx
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import styles from './Modal.module.css';

/**
 * Modal component for dialogs, popups, and confirmation windows
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {Function} props.onClose - Function to call when modal should close
 * @param {string} [props.title] - Modal title
 * @param {React.ReactNode} props.children - Modal content
 * @param {string} [props.size='medium'] - Modal size ('small', 'medium', 'large')
 * @param {boolean} [props.closeOnEsc=true] - Whether pressing Escape should close the modal
 * @param {boolean} [props.closeOnOverlayClick=true] - Whether clicking the overlay should close the modal
 */
function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  closeOnEsc = true,
  closeOnOverlayClick = true
}) {
  const modalRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleEscKeyPress = (e) => {
      if (closeOnEsc && isOpen && e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKeyPress);
      // Prevent scrolling of the body when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKeyPress);
      // Restore scrolling when modal is closed
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, closeOnEsc]);

  // Focus trap inside modal
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  // Don't render anything if modal is not open
  if (!isOpen) {
    return null;
  }

  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div 
        ref={modalRef}
        className={`${styles.modal} ${styles[size]}`}
        tabIndex={-1}
      >
        <div className={styles.header}>
          {title && <h2 className={styles.title}>{title}</h2>}
          <button 
            className={styles.closeButton} 
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  closeOnEsc: PropTypes.bool,
  closeOnOverlayClick: PropTypes.bool
};

export default Modal;