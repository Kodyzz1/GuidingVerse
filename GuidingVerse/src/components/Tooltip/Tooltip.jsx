// src/components/Tooltip/Tooltip.jsx
import React, { useState, useRef, useEffect } from 'react';
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
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({});
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null);

  // Calculate tooltip position based on trigger element
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
      default:
        top = -tooltipRect.height - 8;
        left = (triggerRect.width - tooltipRect.width) / 2;
    }

    setTooltipPosition({ top, left });
  };

  // Show/hide tooltip with delay
  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      // Calculate position after tooltip is rendered
      setTimeout(calculatePosition, 0);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Recalculate position on window resize
  useEffect(() => {
    if (isVisible) {
      window.addEventListener('resize', calculatePosition);
      return () => window.removeEventListener('resize', calculatePosition);
    }
  }, [isVisible]);

  return (
    <div 
      className={styles.tooltipContainer} 
      ref={triggerRef}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div 
          ref={tooltipRef}
          className={`${styles.tooltip} ${styles[position]}`}
          style={{ 
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

Tooltip.propTypes = {
  children: PropTypes.node.isRequired,
  content: PropTypes.string.isRequired,
  position: PropTypes.oneOf(['top', 'right', 'bottom', 'left']),
  delay: PropTypes.number
};

export default Tooltip;