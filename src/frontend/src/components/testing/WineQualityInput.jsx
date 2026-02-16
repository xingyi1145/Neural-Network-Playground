import { useState, useEffect, useRef } from 'react';

const WINE_FEATURES = [
  { name: 'fixedAcidity', label: 'Fixed Acidity', unit: 'g/dm³', hint: 'Backbone acids (tartaric). Higher → sharper taste.', min: 4, max: 16, default: 7.4, step: 0.1, category: 'Acidity & Freshness' },
  { name: 'volatileAcidity', label: 'Volatile Acidity', unit: 'g/dm³', hint: 'Vinegar-like acids (acetic). Too high smells off.', min: 0, max: 1.6, default: 0.5, step: 0.01, category: 'Acidity & Freshness' },
  { name: 'citricAcid', label: 'Citric Acid', unit: 'g/dm³', hint: 'Fresh citrus bite; small amounts lift flavor.', min: 0, max: 1, default: 0.3, step: 0.01, category: 'Acidity & Freshness' },
  { name: 'pH', label: 'pH', unit: '', hint: 'Acid strength. Lower = more tart.', min: 2.8, max: 4, default: 3.3, step: 0.01, category: 'Acidity & Freshness' },
  { name: 'residualSugar', label: 'Residual Sugar', unit: 'g/dm³', hint: 'Sweetness left after ferment. Table wine stays low.', min: 0, max: 16, default: 2.5, step: 0.1, category: 'Sweetness & Body' },
  { name: 'density', label: 'Density', unit: 'g/cm³', hint: 'Related to sugar/alcohol balance.', min: 0.99, max: 1.01, default: 0.997, step: 0.0005, category: 'Sweetness & Body' },
  { name: 'alcohol', label: 'Alcohol', unit: '%', hint: 'More alcohol typically raises perceived quality.', min: 8, max: 15, default: 10.5, step: 0.1, category: 'Sweetness & Body' },
  { name: 'chlorides', label: 'Chlorides', unit: 'g/dm³', hint: 'Salt content; too much tastes briny.', min: 0, max: 0.6, default: 0.08, step: 0.01, category: 'Stability & Preservatives' },
  { name: 'freeSulfur', label: 'Free SO₂', unit: 'mg/dm³', hint: 'Active preservative; protects but can sting.', min: 0, max: 70, default: 15, step: 1, category: 'Stability & Preservatives' },
  { name: 'totalSulfur', label: 'Total SO₂', unit: 'mg/dm³', hint: 'Overall sulfur load; keep moderate.', min: 0, max: 300, default: 50, step: 1, category: 'Stability & Preservatives' },
  { name: 'sulphates', label: 'Sulphates', unit: 'g/dm³', hint: 'Stabilizer; can boost body and preservation.', min: 0.3, max: 2, default: 0.6, step: 0.01, category: 'Stability & Preservatives' },
];

const buildDefaults = () =>
  WINE_FEATURES.reduce((acc, f) => ({ ...acc, [f.name]: f.default }), {});

// Wine glass visualization that responds to the slider values
function WineVisualization({ alcohol, pH, residualSugar, volatileAcidity }) {
  const normalize = (value, min, max, targetMin, targetMax) => {
    return targetMin + ((value - min) / (max - min)) * (targetMax - targetMin);
  };

  // Wine color based on pH and acidity (lower pH = more vibrant red)
  const colorIntensity = normalize(pH, 2.8, 4, 1, 0.5);
  const redValue = Math.round(140 + colorIntensity * 60);
  const wineColor = `rgb(${redValue}, 20, 40)`;
  const wineColorLight = `rgb(${redValue + 40}, 40, 60)`;
  
  // Fill level based on alcohol content
  const fillLevel = normalize(alcohol, 8, 15, 30, 75);
  
  // Bubble count based on volatile acidity (more = more bubbles/fizz)
  const bubbleCount = Math.round(normalize(volatileAcidity, 0, 1.6, 0, 8));
  
  // Sweetness indicator - sugar affects "legs" on glass
  const legCount = Math.round(normalize(residualSugar, 0, 16, 2, 8));
  
  // Body/viscosity based on density approximation (sugar + alcohol)
  const viscosity = normalize(residualSugar + alcohol * 0.5, 8, 24, 0.3, 1);

  return (
    <svg viewBox="0 0 120 160" className="w-full h-full">
      <defs>
        <linearGradient id="wineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={wineColorLight} />
          <stop offset="50%" stopColor={wineColor} />
          <stop offset="100%" stopColor="rgb(80, 10, 25)" />
        </linearGradient>
        <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.15)" />
        </linearGradient>
        <linearGradient id="stemGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.2)" />
        </linearGradient>
        <filter id="wineGlow">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <clipPath id="glassClip">
          <path d="M 30 25 Q 25 50 28 75 Q 30 90 45 95 L 45 95 Q 55 97 60 97 Q 65 97 75 95 L 75 95 Q 90 90 92 75 Q 95 50 90 25 Z" />
        </clipPath>
      </defs>

      {/* Background */}
      <rect x="0" y="0" width="120" height="160" fill="#1f2937" rx="8" />
      
      {/* Wine glass bowl outline */}
      <path 
        d="M 30 25 Q 25 50 28 75 Q 30 90 45 95 L 45 95 Q 55 97 60 97 Q 65 97 75 95 L 75 95 Q 90 90 92 75 Q 95 50 90 25 Z"
        fill="url(#glassGrad)"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1"
      />
      
      {/* Wine fill */}
      <g clipPath="url(#glassClip)">
        <rect 
          x="28" 
          y={95 - fillLevel} 
          width="64" 
          height={fillLevel + 5}
          fill="url(#wineGrad)"
          filter="url(#wineGlow)"
        />
        
        {/* Wine surface highlight */}
        <ellipse 
          cx="60" 
          cy={95 - fillLevel + 2} 
          rx="30" 
          ry="4"
          fill={wineColorLight}
          opacity="0.6"
        />
        
        {/* Bubbles based on volatile acidity */}
        {Array.from({ length: bubbleCount }).map((_, i) => (
          <circle
            key={i}
            cx={35 + (i * 7) + Math.sin(i) * 5}
            cy={95 - fillLevel + 10 + (i % 3) * 8}
            r={1 + (i % 2)}
            fill="rgba(255,255,255,0.3)"
          />
        ))}
        
        {/* Wine legs inside glass (above wine level) */}
        {Array.from({ length: legCount }).map((_, i) => {
          const legX = 35 + i * (50 / (legCount + 1));
          const wineTop = 95 - fillLevel;
          return (
            <line
              key={`leg-${i}`}
              x1={legX}
              y1={wineTop - 2}
              x2={legX + (i % 2 ? 1 : -1)}
              y2={wineTop - 8 - (viscosity * 8)}
              stroke={wineColor}
              strokeWidth="1.5"
              opacity={0.5}
              strokeLinecap="round"
            />
          );
        })}
      </g>
      
      {/* Glass rim highlight */}
      <ellipse cx="60" cy="25" rx="30" ry="5" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      
      {/* Glass stem */}
      <rect x="57" y="97" width="6" height="35" fill="url(#stemGrad)" rx="1" />
      
      {/* Glass base */}
      <ellipse cx="60" cy="135" rx="20" ry="5" fill="url(#stemGrad)" />
      <ellipse cx="60" cy="137" rx="22" ry="4" fill="rgba(255,255,255,0.1)" />
      
      {/* Quality indicators */}
      <g className="text-[8px]">
        {/* Alcohol indicator */}
        <text x="8" y="150" fill="#9ca3af" fontSize="7">ABV</text>
        <text x="8" y="158" fill="#fbbf24" fontSize="8" fontWeight="bold">{alcohol.toFixed(1)}%</text>
        
        {/* pH indicator */}
        <text x="95" y="150" fill="#9ca3af" fontSize="7">pH</text>
        <text x="95" y="158" fill="#f87171" fontSize="8" fontWeight="bold">{pH.toFixed(1)}</text>
      </g>
    </svg>
  );
}

const WineQualityInput = ({ onInputChange }) => {
  const [values, setValues] = useState(buildDefaults);
  const onInputChangeRef = useRef(onInputChange);
  
  // Keep callback ref up to date
  useEffect(() => {
    onInputChangeRef.current = onInputChange;
  }, [onInputChange]);

  useEffect(() => {
    const inputArray = WINE_FEATURES.map(f => values[f.name]);
    onInputChangeRef.current(inputArray);
  }, [values]);

  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: parseFloat(value) }));
  };

  const presets = {
    'Table (easy drinker)': { alcohol: 9.5, fixedAcidity: 7, volatileAcidity: 0.55, residualSugar: 2.0, pH: 3.4 },
    'Balanced (house red)': { alcohol: 11, fixedAcidity: 8, volatileAcidity: 0.4, residualSugar: 2.5, pH: 3.3 },
    'Cellar-worthy': { alcohol: 12.5, fixedAcidity: 9, volatileAcidity: 0.3, residualSugar: 2.0, pH: 3.15 },
  };

  const formatValue = (feature, value) => {
    if (feature.name === 'density') return value.toFixed(4);
    if (feature.step < 0.02) return value.toFixed(2);
    if (feature.step < 0.1) return value.toFixed(2);
    return value.toFixed(1);
  };

  const SliderRow = ({ feature }) => (
    <div className="rounded-md border border-gray-700 bg-gray-800/80 p-2.5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] text-gray-100 leading-tight">{feature.label}</p>
          <p className="text-[10px] text-gray-500 leading-tight">{feature.hint}</p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {feature.unit && (
            <span className="text-[10px] text-gray-400 border border-gray-700 rounded px-1.5 py-0.5 leading-none">
              {feature.unit}
            </span>
          )}
          <span className="text-xs text-amber-200 font-mono bg-gray-800/80 px-2 py-0.5 rounded">
            {formatValue(feature, values[feature.name])}
          </span>
        </div>
      </div>
      <input
        type="range"
        min={feature.min}
        max={feature.max}
        step={feature.step}
        value={values[feature.name]}
        onChange={(e) => handleChange(feature.name, e.target.value)}
        className="w-full h-1.5 bg-gray-700/70 rounded-full appearance-none cursor-pointer accent-amber-400 mt-2"
      />
      <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono mt-1">
        <span>{feature.min}</span>
        <span>{feature.max}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Wine Glass Visualization */}
      <div className="flex gap-3">
        <div className="w-28 flex-shrink-0 rounded-xl border border-gray-700/50 bg-gray-800/50 overflow-hidden">
          <WineVisualization
            alcohol={values.alcohol}
            pH={values.pH}
            residualSugar={values.residualSugar}
            volatileAcidity={values.volatileAcidity}
            fixedAcidity={values.fixedAcidity}
            sulphates={values.sulphates}
          />
        </div>
        <div className="flex-1 p-3 bg-gradient-to-r from-gray-800 via-gray-800/70 to-gray-750 border border-gray-700 rounded-lg text-[11px] text-gray-300 leading-snug shadow-inner">
          <div className="flex flex-col h-full justify-between">
            <div>
              <p className="font-semibold text-white mb-0.5">Sommelier lab slip</p>
              <p className="text-gray-400 text-[10px]">
                11 lab measurements feed the model to predict expert quality (3-9 scale).
              </p>
            </div>
            <div className="text-[10px] text-blue-200 bg-blue-900/40 border border-blue-700/70 rounded px-2 py-1 font-semibold uppercase tracking-wide flex items-center gap-1 w-fit mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              11 features
            </div>
          </div>
        </div>
      </div>

      {/* Presets */}
      <div className="flex items-center gap-2 flex-wrap bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2">
        <span className="text-xs text-gray-400">Quick presets:</span>
        <div className="flex gap-1.5 flex-wrap">
          {Object.entries(presets).map(([name, preset]) => (
            <button
              key={name}
              onClick={() => setValues(prev => ({ ...prev, ...preset }))}
              className="px-2.5 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-100 rounded transition-colors border border-gray-600 shadow-sm"
            >
              {name}
            </button>
          ))}
          <button
            onClick={() => setValues(buildDefaults())}
            className="px-2.5 py-1 text-xs text-gray-200 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded transition-colors"
          >
            Reset sliders
          </button>
        </div>
      </div>

      {/* Small slider strip */}
      <div className="grid sm:grid-cols-2 gap-2">
        {WINE_FEATURES.map((feature) => (
          <SliderRow key={feature.name} feature={feature} />
        ))}
      </div>
    </div>
  );
};

export default WineQualityInput;
