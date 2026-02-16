import { useState, useEffect, useRef } from 'react';

const IRIS_FEATURES = [
  { name: 'sepalLength', label: 'Sepal Length', min: 4.0, max: 8.0, default: 5.8 },
  { name: 'sepalWidth', label: 'Sepal Width', min: 2.0, max: 4.5, default: 3.0 },
  { name: 'petalLength', label: 'Petal Length', min: 1.0, max: 7.0, default: 4.0 },
  { name: 'petalWidth', label: 'Petal Width', min: 0.1, max: 2.5, default: 1.2 },
];

// SVG Flower component that dynamically renders based on measurements
function FlowerVisualization({ sepalLength, sepalWidth, petalLength, petalWidth }) {
  // Normalize values for visualization (scale to reasonable SVG dimensions)
  const normalize = (value, min, max, targetMin, targetMax) => {
    return targetMin + ((value - min) / (max - min)) * (targetMax - targetMin);
  };

  // Scale measurements to SVG coordinates
  const sepalL = normalize(sepalLength, 4.0, 8.0, 45, 85);
  const sepalW = normalize(sepalWidth, 2.0, 4.5, 15, 35);
  const petalL = normalize(petalLength, 1.0, 7.0, 20, 60);
  const petalW = normalize(petalWidth, 0.1, 2.5, 4, 22);

  const cx = 100; // center x
  const cy = 100; // center y

  // Generate petal/sepal paths for 4 directions
  const createPetalPath = (length, width, angle) => {
    const rad = (angle * Math.PI) / 180;
    const tipX = cx + Math.cos(rad) * length;
    const tipY = cy - Math.sin(rad) * length;
    
    // Control points for bezier curve (creates rounded petal shape)
    const perpRad = rad + Math.PI / 2;
    const cp1X = cx + Math.cos(rad) * (length * 0.5) + Math.cos(perpRad) * width;
    const cp1Y = cy - Math.sin(rad) * (length * 0.5) - Math.sin(perpRad) * width;
    const cp2X = cx + Math.cos(rad) * (length * 0.5) - Math.cos(perpRad) * width;
    const cp2Y = cy - Math.sin(rad) * (length * 0.5) + Math.sin(perpRad) * width;

    return `M ${cx} ${cy} Q ${cp1X} ${cp1Y} ${tipX} ${tipY} Q ${cp2X} ${cp2Y} ${cx} ${cy}`;
  };

  const sepalAngles = [45, 135, 225, 315]; // diagonal positions for sepals
  const petalAngles = [0, 90, 180, 270]; // cardinal positions for petals

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {/* Background gradient */}
      <defs>
        <radialGradient id="bgGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1f2937" />
          <stop offset="100%" stopColor="#111827" />
        </radialGradient>
        <radialGradient id="sepalGradient" cx="30%" cy="30%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#15803d" />
        </radialGradient>
        <radialGradient id="petalGradient" cx="30%" cy="30%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#7c3aed" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Background circle */}
      <circle cx={cx} cy={cy} r="95" fill="url(#bgGradient)" />

      {/* Sepals (green, behind petals) */}
      <g filter="url(#glow)">
        {sepalAngles.map((angle, i) => (
          <path
            key={`sepal-${i}`}
            d={createPetalPath(sepalL, sepalW, angle)}
            fill="url(#sepalGradient)"
            opacity="0.9"
            className="transition-all duration-300"
          />
        ))}
      </g>

      {/* Petals (purple, in front) */}
      <g filter="url(#glow)">
        {petalAngles.map((angle, i) => (
          <path
            key={`petal-${i}`}
            d={createPetalPath(petalL, petalW, angle)}
            fill="url(#petalGradient)"
            opacity="0.95"
            className="transition-all duration-300"
          />
        ))}
      </g>

      {/* Center of flower */}
      <circle cx={cx} cy={cy} r="8" fill="#fbbf24" filter="url(#glow)" />
      <circle cx={cx} cy={cy} r="4" fill="#f59e0b" />
    </svg>
  );
}

function IrisInput({ onInputChange }) {
  const presets = {
    Setosa: { sepalLength: 5.1, sepalWidth: 3.5, petalLength: 1.4, petalWidth: 0.2, tone: 'from-emerald-500/30 to-emerald-500/5' },
    Versicolor: { sepalLength: 5.9, sepalWidth: 2.8, petalLength: 4.5, petalWidth: 1.3, tone: 'from-blue-500/30 to-blue-500/5' },
    Virginica: { sepalLength: 6.6, sepalWidth: 3.0, petalLength: 5.5, petalWidth: 2.1, tone: 'from-purple-500/30 to-purple-500/5' },
  };

  const [values, setValues] = useState(presets.Setosa);
  const [activePreset, setActivePreset] = useState('Setosa');
  const onInputChangeRef = useRef(onInputChange);
  
  // Keep callback ref up to date
  useEffect(() => {
    onInputChangeRef.current = onInputChange;
  }, [onInputChange]);

  // Only call onInputChange when values actually change
  useEffect(() => {
    const inputArray = IRIS_FEATURES.map(f => values[f.name]);
    onInputChangeRef.current(inputArray);
  }, [values]);

  const handleChange = (name, value) => {
    setActivePreset(null);
    setValues(prev => ({ ...prev, [name]: parseFloat(value) }));
  };

  const applyPreset = (name) => {
    const preset = presets[name];
    setActivePreset(name);
    setValues(preset);
  };

  return (
    <div className="space-y-2.5">
      {/* Interactive Flower Visualization */}
      <div className="relative rounded-xl border border-gray-700/50 bg-gray-800/50 overflow-hidden">
        <div className="aspect-square w-full max-w-32 max-h-32 mx-auto">
          <FlowerVisualization
            sepalLength={values.sepalLength}
            sepalWidth={values.sepalWidth}
            petalLength={values.petalLength}
            petalWidth={values.petalWidth}
          />
        </div>
        <div className="absolute top-2 right-2 text-[10px] text-gray-500 bg-gray-900/70 px-2 py-1 rounded">
          {activePreset || 'Custom'}
        </div>
      </div>

      {/* Presets with Real Flower Images */}
      <div className="space-y-1.5">
        <span className="text-xs text-gray-400">Quick presets</span>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(presets).map(([name]) => {
            const flowerImages = {
              Setosa: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Kosaciec_szczecinkowaty_Iris_setosa.jpg/180px-Kosaciec_szczecinkowaty_Iris_setosa.jpg',
              Versicolor: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Iris_versicolor_3.jpg/180px-Iris_versicolor_3.jpg',
              Virginica: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Iris_virginica.jpg/180px-Iris_virginica.jpg',
            };
            return (
              <button
                key={name}
                onClick={() => applyPreset(name)}
                className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all ${
                  activePreset === name
                    ? 'border-emerald-500 bg-emerald-500/20'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
                type="button"
              >
                <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-700/50">
                  <img 
                    src={flowerImages[name]} 
                    alt={`Iris ${name}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className={`text-[10px] font-medium ${
                  activePreset === name ? 'text-emerald-400' : 'text-gray-400'
                }`}>
                  {name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Feature Sliders - 2x2 grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {IRIS_FEATURES.map((feature) => {
          const isSepal = feature.name.includes('sepal');
          const colorClass = isSepal ? 'text-emerald-400' : 'text-purple-400';
          const accentClass = isSepal ? 'accent-emerald-500' : 'accent-purple-500';
          
          return (
            <div key={feature.name} className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">{feature.label}</label>
                <span className={`text-xs ${colorClass} font-mono`}>{values[feature.name].toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={feature.min}
                max={feature.max}
                step={0.1}
                value={values[feature.name]}
                onChange={(e) => handleChange(feature.name, e.target.value)}
                className={`w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer ${accentClass}`}
              />
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-3 text-[10px] text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700"></div>
          <span>Sepals (green)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-purple-700"></div>
          <span>Petals (purple)</span>
        </div>
      </div>
    </div>
  );
}

export default IrisInput;
