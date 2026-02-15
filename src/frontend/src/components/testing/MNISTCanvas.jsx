import { useRef, useState, useEffect, useCallback } from 'react';

const MNISTCanvas = ({ onInputChange }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPixel, setLastPixel] = useState(null);
  const cellSize = 9; // Each pixel is 9x9 screen pixels
  const canvasSize = cellSize * 28;

  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 28; i++) {
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, 28 * cellSize);
      ctx.stroke();
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(28 * cellSize, i * cellSize);
      ctx.stroke();
    }
  }, []);

  // Initialize canvas with grid
  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  const getPixelCoords = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;
    if (e.touches) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = Math.floor((clientX - rect.left) / cellSize);
    const y = Math.floor((clientY - rect.top) / cellSize);

    return { x: Math.max(0, Math.min(27, x)), y: Math.max(0, Math.min(27, y)) };
  }, []);

  const drawPixel = useCallback((x, y) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Soft brush with anti-aliasing - 3x3 brush with varying intensities
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const px = x + dx;
        const py = y + dy;
        if (px >= 0 && px < 28 && py >= 0 && py < 28) {
          // Calculate distance from brush center for falloff
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Brush intensity based on distance
          // Center: 1.0, Adjacent: 0.6, Diagonal: 0.3
          let intensity;
          if (distance === 0) {
            intensity = 1.0;
          } else if (distance <= 1.0) {
            intensity = 0.6;
          } else {
            intensity = 0.3;
          }

          // Get current pixel value
          const imageData = ctx.getImageData(px * cellSize, py * cellSize, cellSize, cellSize);
          const currentValue = imageData.data[0] / 255.0;

          // Blend with existing value (additive with max clamp)
          const newValue = Math.min(1.0, currentValue + intensity * 0.4);

          // Draw pixel with calculated intensity
          const grayValue = Math.floor(newValue * 255);
          ctx.fillStyle = `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
          ctx.fillRect(px * cellSize, py * cellSize, cellSize, cellSize);
        }
      }
    }
  }, []);

  // Bresenham's line algorithm to interpolate between points
  const drawLine = useCallback((x0, y0, x1, y1) => {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let x = x0;
    let y = y0;

    for (;;) {
      drawPixel(x, y);

      if (x === x1 && y === y1) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }, [drawPixel]);

  const startDrawing = useCallback((e) => {
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getPixelCoords(e);
    setLastPixel({ x, y });
    drawPixel(x, y);
  }, [getPixelCoords, drawPixel]);

  const draw = useCallback((e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getPixelCoords(e);

    // Interpolate between last pixel and current pixel
    if (lastPixel && (lastPixel.x !== x || lastPixel.y !== y)) {
      drawLine(lastPixel.x, lastPixel.y, x, y);
      setLastPixel({ x, y });
    }
  }, [isDrawing, lastPixel, getPixelCoords, drawLine]);

  const stopDrawing = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      setLastPixel(null);
      extractPixelData();
    }
  }, [isDrawing]);

  const extractPixelData = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = [];

    // Sample the center of each 9x9 cell to get the 28x28 pixel values
    for (let y = 0; y < 28; y++) {
      for (let x = 0; x < 28; x++) {
        const centerX = x * cellSize + Math.floor(cellSize / 2);
        const centerY = y * cellSize + Math.floor(cellSize / 2);
        const idx = (centerY * canvas.width + centerX) * 4;
        const value = imageData.data[idx] / 255.0;
        pixels.push(value);
      }
    }

    onInputChange(pixels);
  }, [onInputChange]);

  const clearCanvas = useCallback(() => {
    drawGrid();
    onInputChange(null);
  }, [drawGrid, onInputChange]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">
          Draw a digit (0-9)
        </label>
        <button
          onClick={clearCanvas}
          className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
        >
          Clear
        </button>
      </div>

      <div className="relative mx-auto" style={{ width: canvasSize, height: canvasSize }}>
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          className="border-2 border-gray-600 rounded cursor-crosshair bg-black touch-none"
          style={{ imageRendering: 'pixelated' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      <p className="text-xs text-gray-400 text-center">
        Each square represents one pixel. Draw on the 28×28 grid.
      </p>
    </div>
  );
};

export default MNISTCanvas;





