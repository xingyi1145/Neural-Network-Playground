import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const Tooltip = ({ text, children, position = 'top', className = '' }) => {
  const wrapperRef = useRef(null);
  const tooltipRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [placement, setPlacement] = useState(position);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [arrowOffset, setArrowOffset] = useState(0);

  const choosePlacement = useCallback(() => {
    if (!wrapperRef.current || !tooltipRef.current) return;
    const triggerRect = wrapperRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const margin = 8;

    const space = {
      top: triggerRect.top,
      bottom: window.innerHeight - triggerRect.bottom,
      left: triggerRect.left,
      right: window.innerWidth - triggerRect.right,
    };

    const order = (() => {
      if (position === 'left') return ['left', 'right', 'top', 'bottom', 'left'];
      if (position === 'right') return ['right', 'left', 'top', 'bottom', 'right'];
      if (position === 'bottom') return ['bottom', 'top', 'right', 'left', 'bottom'];
      return ['top', 'bottom', 'right', 'left', 'top'];
    })();
    let best = order.find((dir) => {
      if (dir === 'top' || dir === 'bottom') {
        return space[dir] >= tooltipRect.height + margin;
      }
      return space[dir] >= tooltipRect.width + margin;
    });

    if (!best) {
      best = Object.entries(space).sort((a, b) => b[1] - a[1])[0][0];
    }

    let top = 0;
    let left = 0;

    switch (best) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - margin;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + margin;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'left':
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.left - tooltipRect.width - margin;
        break;
      case 'right':
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.right + margin;
        break;
      default:
        break;
    }

    const clampedLeft = Math.min(
      Math.max(left, 8),
      window.innerWidth - tooltipRect.width - 8
    );
    const clampedTop = Math.min(
      Math.max(top, 8),
      window.innerHeight - tooltipRect.height - 8
    );

    setCoords({ top: clampedTop, left: clampedLeft });
    setPlacement(best);
    setArrowOffset(
      Math.max(
        8,
        Math.min(triggerRect.left + triggerRect.width / 2 - clampedLeft, tooltipRect.width - 8)
      )
    );
  }, [position, text]);

  useEffect(() => {
    if (!visible) return;
    choosePlacement();
    const handleResize = () => choosePlacement();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [visible, choosePlacement]);

  const arrowPlacementStyle = () => {
    switch (placement) {
      case 'top':
        return { top: '100%', left: arrowOffset, transform: 'translate(-50%, -50%) rotate(45deg)' };
      case 'bottom':
        return { bottom: '100%', left: arrowOffset, transform: 'translate(-50%, 50%) rotate(225deg)' };
      case 'left':
        return { left: '100%', top: '50%', transform: 'translate(50%, -50%) rotate(315deg)' };
      case 'right':
        return { right: '100%', top: '50%', transform: 'translate(-50%, -50%) rotate(135deg)' };
      default:
        return {};
    }
  };

  return (
    <div
      ref={wrapperRef}
      className="inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {createPortal(
        <div
          ref={tooltipRef}
          className={`pointer-events-none fixed px-3 py-2 rounded-lg bg-gray-900/95 border border-blue-600/40 shadow-lg text-xs text-gray-100 whitespace-normal break-words text-left leading-snug min-w-[180px] max-w-sm z-50 transition duration-150 ease-out ${
            visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 scale-95'
          } ${className}`}
          style={{ top: coords.top, left: coords.left }}
        >
          {text}
          <span
            className="pointer-events-none absolute w-3 h-3 bg-gray-900/95 border-l border-t border-blue-600/40"
            style={arrowPlacementStyle()}
          />
        </div>,
        document.body
      )}
    </div>
  );
};

export default Tooltip;
