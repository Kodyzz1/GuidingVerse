// src/components/Tooltip/Tooltip.jsx
import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './Tooltip.module.css';

/**
 * Tooltip component to display hints or additional information on hover
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Element that triggers the tooltip
 * @param {string} props.content - Tooltip content
 * @param {string} [props.position='top'] - Tooltip position ('top', 'right', 'bottom', 'left')
 * @param {number} [props.delay=300] - Delay before showing tooltip (ms)
 */
function Tooltip({ children, content, position = 'top', delay = 300 }) {
  // --- State ---
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({});

  // --- Refs ---
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null); // For hover delay

  // --- Handlers ---
  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    let top, left;

    switch (position) {
      case 'top':
        top = -tooltipRect.height - 8;
        left = (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'right':
        top = (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.width + 8;
        break;
      case 'bottom':
        top = triggerRect.height + 8;
        left = (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = (triggerRect.height - tooltipRect.height) / 2;
        left = -tooltipRect.width - 8;
        break;
      default: // Default to top
        top = -tooltipRect.height - 8;
        left = (triggerRect.width - tooltipRect.width) / 2;
    }
    setTooltipPosition({ top, left });
  };

  const showTooltip = () => {
    // Clear any existing hide timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Set timeout to show
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      // Calculate position only *after* state update causes tooltip to render
      setTimeout(calculatePosition, 0);
    }, delay);
  };

  const hideTooltip = () => {
    // Clear show timeout if it exists
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  // --- Effects ---
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Recalculate position on window resize when visible
  useEffect(() => {
    if (isVisible) {
      window.addEventListener('resize', calculatePosition);
      return () => window.removeEventListener('resize', calculatePosition);
    }
  }, [isVisible]); // Only add/remove listener when visibility changes

  // --- JSX Structure ---
  return (
    <div
      className={styles.tooltipContainer}
      ref={triggerRef}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      // Add aria-describedby if needed for accessibility
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`${styles.tooltip} ${styles[position]}`}
          style={{
            // Position is calculated and applied via state
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`
          }}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  );
}

// --- Prop Types ---
Tooltip.propTypes = {
  children: PropTypes.node.isRequired,
  content: PropTypes.string.isRequired,
  position: PropTypes.oneOf(['top', 'right', 'bottom', 'left']),
  delay: PropTypes.number
};

export default Tooltip;