import { useState, useRef, useCallback, useEffect } from 'react';

const SyntheticInput = ({ onInputChange }) => {
  const canvasRef = useRef(null);
  const [point, setPoint] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const onInputChangeRef = useRef(onInputChange);

  const SIZE = 180;
  const HALF = SIZE / 2;
  
  // Keep callback ref up to date
  useEffect(() => {
    onInputChangeRef.current = onInputChange;
  }, [onInputChange]);

  useEffect(() => {
    drawCanvas();
  }, [point]);

  useEffect(() => {
    onInputChangeRef.current([point.x, point.y]);
  }, [point]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, SIZE, SIZE);
    
    // Grid lines
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(HALF, 0);
    ctx.lineTo(HALF, SIZE);
    ctx.moveTo(0, HALF);
    ctx.lineTo(SIZE, HALF);
    ctx.stroke();
    
    // XOR quadrant colors - align with dataset labels (class 0 = same sign, class 1 = opposite signs)
    ctx.globalAlpha = 0.15;
    // Class 0 (same sign): top-right and bottom-left
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(HALF, 0, HALF, HALF);
    ctx.fillRect(0, HALF, HALF, HALF);
    // Class 1 (opposite signs): top-left and bottom-right
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, 0, HALF, HALF);
    ctx.fillRect(HALF, HALF, HALF, HALF);
    ctx.globalAlpha = 1;
    
    // Draw point
    const canvasX = (point.x + 1) * HALF;
    const canvasY = (1 - point.y) * HALF;
    
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#3b82f6';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [point]);

  const handleCanvasInteraction = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = SIZE / rect.width;
    const scaleY = SIZE / rect.height;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const canvasX = (clientX - rect.left) * scaleX;
    const canvasY = (clientY - rect.top) * scaleY;
    
    const x = (canvasX / HALF) - 1;
    const y = 1 - (canvasY / HALF);
    
    setPoint({
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y))
    });
  }, []);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleCanvasInteraction(e);
  };

  const handleMouseMove = (e) => {
    if (isDragging) handleCanvasInteraction(e);
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">Click or drag to place point</span>
        <span className="text-xs text-gray-500 font-mono">
          ({point.x.toFixed(2)}, {point.y.toFixed(2)})
        </span>
      </div>
      
      {/* Canvas */}
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          className="border border-gray-600 rounded-lg cursor-crosshair touch-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        />
      </div>
      
      {/* Legend */}
      <div className="flex justify-center gap-4 text-xs text-gray-400">
        <span><span className="inline-block w-2 h-2 bg-red-500/40 rounded mr-1"></span>Class 0 (same sign)</span>
        <span><span className="inline-block w-2 h-2 bg-green-500/40 rounded mr-1"></span>Class 1 (opposite signs)</span>
      </div>
    </div>
  );
};

export default SyntheticInput;
