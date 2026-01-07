import { useState, useEffect, useRef } from 'react';

const HOUSING_FEATURES = [
  { name: 'medInc', label: 'Median Income', unit: '$10k', hint: 'Household median income (tens of thousands USD)', min: 0, max: 15, default: 3.5, step: 0.1 },
  { name: 'houseAge', label: 'House Age', unit: 'years', hint: 'Median house age', min: 1, max: 52, default: 25, step: 1 },
  { name: 'avgRooms', label: 'Avg Rooms', unit: 'rooms', hint: 'Average rooms per household', min: 1, max: 10, default: 5, step: 0.1 },
  { name: 'avgBedrooms', label: 'Avg Bedrooms', unit: 'rooms', hint: 'Average bedrooms per household', min: 0.5, max: 5, default: 1, step: 0.1 },
  { name: 'population', label: 'Block Group Pop.', unit: 'people', hint: 'Block group population', min: 100, max: 5000, default: 1500, step: 50 },
  { name: 'avgOccup', label: 'Avg Occupancy', unit: 'people', hint: 'Average occupants per household', min: 1, max: 10, default: 3, step: 0.1 },
  { name: 'latitude', label: 'Latitude', unit: '°N', hint: 'Latitude of block group', min: 32.5, max: 42, default: 34.5, step: 0.1 },
  { name: 'longitude', label: 'Longitude', unit: '°W', hint: 'Longitude of block group', min: -124.5, max: -114, default: -118.5, step: 0.1 },
];

// Modern house visualization with better aesthetics
function HouseVisualization({ medInc, houseAge, avgRooms, avgBedrooms, avgOccup, population }) {
  const normalize = (value, min, max, targetMin, targetMax) => {
    return targetMin + ((value - min) / (max - min)) * (targetMax - targetMin);
  };

  // House characteristics
  const houseScale = normalize(avgRooms, 1, 10, 0.7, 1.3);
  const incomeLevel = normalize(medInc, 0, 15, 0, 4); // 0-4 tier
  // Age affects disrepair - older houses look worse
  const ageDecay = normalize(houseAge, 1, 52, 0, 1); // 0 = new, 1 = old
  // More bedrooms = more windows (scaled more aggressively)
  const numWindows = Math.min(Math.round(avgBedrooms * 1.5), 6);
  const numPeople = Math.min(Math.round(avgOccup), 10); // Now supports up to 10 people
  // Population density for background buildings
  const density = normalize(population, 100, 5000, 0, 1);
  const numBackgroundBuildings = Math.floor(density * 8); // 0-8 buildings

  // House style based on income
  const getHouseStyle = () => {
    if (incomeLevel >= 3) return 'luxury';
    if (incomeLevel >= 2) return 'modern';
    if (incomeLevel >= 1) return 'suburban';
    return 'modest';
  };
  const style = getHouseStyle();

  const baseWidth = 70 * houseScale;
  const baseHeight = 50 * houseScale;
  const cx = 100;
  const groundY = 155;

  // Disrepair colors based on age
  const getWallColor = () => {
    if (ageDecay > 0.7) return { start: '#B8A89A', end: '#9A8A7A' }; // Faded/dirty
    if (ageDecay > 0.4) return { start: '#D4C4B0', end: '#C4B4A0' }; // Aged
    if (style === 'luxury') return { start: '#F7FAFC', end: '#E2E8F0' };
    if (style === 'modern') return { start: '#EDF2F7', end: '#E2E8F0' };
    return { start: '#FFF8DC', end: '#F5DEB3' };
  };
  const wallColors = getWallColor();
  
  const getRoofColor = () => {
    if (ageDecay > 0.7) return { start: '#5A4A3A', end: '#3A2A1A' }; // Weathered
    if (ageDecay > 0.4) return { start: '#7A5A3A', end: '#5A3A2A' }; // Aged
    if (style === 'luxury') return { start: '#4A5568', end: '#2D3748' };
    if (style === 'modern') return { start: '#718096', end: '#4A5568' };
    return { start: '#A0522D', end: '#8B4513' };
  };
  const roofColors = getRoofColor();

  return (
    <svg viewBox="0 0 200 180" className="w-full h-full">
      <defs>
        {/* Gradients */}
        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#87CEEB" />
          <stop offset="60%" stopColor="#B0E0E6" />
          <stop offset="100%" stopColor="#E0F4FF" />
        </linearGradient>
        <linearGradient id="grassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7CBA5F" />
          <stop offset="100%" stopColor="#5A9A42" />
        </linearGradient>
        <linearGradient id="pathGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#D4C4A8" />
          <stop offset="100%" stopColor="#B8A88A" />
        </linearGradient>
        <linearGradient id="roofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={roofColors.start} />
          <stop offset="100%" stopColor={roofColors.end} />
        </linearGradient>
        <linearGradient id="wallGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={wallColors.start} />
          <stop offset="100%" stopColor={wallColors.end} />
        </linearGradient>
        <linearGradient id="windowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={ageDecay > 0.6 ? '#8AB4D0' : '#AED9F7'} />
          <stop offset="50%" stopColor={ageDecay > 0.6 ? '#6A9AB8' : '#7EC8E3'} />
          <stop offset="100%" stopColor={ageDecay > 0.6 ? '#5A8AA0' : '#5DADE2'} />
        </linearGradient>
        <linearGradient id="doorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={ageDecay > 0.5 ? '#5A4A3A' : (style === 'luxury' ? '#2D3748' : '#8B4513')} />
          <stop offset="100%" stopColor={ageDecay > 0.5 ? '#3A2A1A' : (style === 'luxury' ? '#1A202C' : '#654321')} />
        </linearGradient>
        <linearGradient id="bgBuildingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6B7280" />
          <stop offset="100%" stopColor="#4B5563" />
        </linearGradient>
        
        {/* Filters */}
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="3" stdDeviation="3" floodOpacity="0.2"/>
        </filter>
        <filter id="windowReflect">
          <feGaussianBlur stdDeviation="0.5" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Sky */}
      <rect x="0" y="0" width="200" height="160" fill="url(#skyGrad)" />
      
      {/* Sun */}
      <circle cx="170" cy="25" r="18" fill="#FFE066" opacity="0.9" />
      <circle cx="170" cy="25" r="14" fill="#FFD700" />
      
      {/* Clouds */}
      <g opacity="0.8">
        <ellipse cx="40" cy="30" rx="20" ry="10" fill="white" />
        <ellipse cx="55" cy="28" rx="15" ry="8" fill="white" />
        <ellipse cx="25" cy="32" rx="12" ry="7" fill="white" />
      </g>
      
      {/* Background hills - fade with more buildings */}
      {numBackgroundBuildings < 4 && (
        <>
          <ellipse cx="50" cy="158" rx="60" ry="15" fill="#8FBC8F" opacity={0.4 - density * 0.3} />
          <ellipse cx="160" cy="158" rx="50" ry="12" fill="#90EE90" opacity={0.3 - density * 0.2} />
        </>
      )}
      
      {/* Background buildings based on population */}
      <g>
        {Array.from({ length: numBackgroundBuildings }).map((_, i) => {
          const positions = [
            { x: 8, h: 35, w: 18 },
            { x: 172, h: 40, w: 20 },
            { x: 25, h: 28, w: 15 },
            { x: 158, h: 32, w: 16 },
            { x: 42, h: 22, w: 14 },
            { x: 145, h: 25, w: 15 },
            { x: 55, h: 18, w: 12 },
            { x: 135, h: 20, w: 13 },
          ];
          const pos = positions[i];
          const buildingY = 155 - pos.h;
          return (
            <g key={i} opacity={0.4 + (i < 2 ? 0.2 : 0)}>
              <rect x={pos.x} y={buildingY} width={pos.w} height={pos.h} fill="url(#bgBuildingGrad)" />
              {/* Windows on background buildings */}
              {Array.from({ length: Math.floor(pos.h / 12) }).map((_, j) => (
                <g key={j}>
                  <rect x={pos.x + 2} y={buildingY + 3 + j * 10} width={4} height={5} fill="#FEF3C7" opacity="0.6" />
                  <rect x={pos.x + pos.w - 6} y={buildingY + 3 + j * 10} width={4} height={5} fill="#FEF3C7" opacity="0.6" />
                </g>
              ))}
            </g>
          );
        })}
      </g>
      
      {/* Ground */}
      <rect x="0" y="155" width="200" height="30" fill="url(#grassGrad)" />

      {/* Pathway */}
      <path 
        d={`M ${cx - 6} 180 Q ${cx - 4} 165 ${cx - 3} ${groundY} L ${cx + 3} ${groundY} Q ${cx + 4} 165 ${cx + 6} 180`}
        fill="url(#pathGrad)"
        stroke="#A0916E"
        strokeWidth="0.5"
      />

      {/* House Group with shadow */}
      <g filter="url(#softShadow)">
        {/* Main house body */}
        <rect 
          x={cx - baseWidth/2} 
          y={groundY - baseHeight} 
          width={baseWidth} 
          height={baseHeight} 
          fill="url(#wallGrad)"
          stroke={ageDecay > 0.5 ? '#8A7A6A' : '#CBD5E0'}
          strokeWidth="0.5"
          rx="1"
        />
        
        {/* Cracks/stains for old houses */}
        {ageDecay > 0.5 && (
          <g opacity={ageDecay * 0.4}>
            <line x1={cx - baseWidth/3} y1={groundY - baseHeight + 5} x2={cx - baseWidth/4} y2={groundY - baseHeight/2} stroke="#7A6A5A" strokeWidth="0.5" />
            <line x1={cx + baseWidth/4} y1={groundY - 10} x2={cx + baseWidth/3} y2={groundY - 5} stroke="#7A6A5A" strokeWidth="0.5" />
          </g>
        )}
        {ageDecay > 0.7 && (
          <g opacity="0.3">
            <rect x={cx - baseWidth/4 - 3} y={groundY - 10} width="8" height="4" rx="1" fill="#6A5A4A" />
            <rect x={cx + baseWidth/3 - 2} y={groundY - baseHeight + 12} width="6" height="3" rx="1" fill="#6A5A4A" />
          </g>
        )}
        
        {/* Roof */}
        {style === 'luxury' || style === 'modern' ? (
          // Flat/modern roof
          <>
            <rect
              x={cx - baseWidth/2 - 3}
              y={groundY - baseHeight - 8}
              width={baseWidth + 6}
              height={10}
              fill="url(#roofGrad)"
              rx="1"
            />
            {style === 'luxury' && (
              <rect
                x={cx - baseWidth/4}
                y={groundY - baseHeight - 20}
                width={baseWidth/2}
                height={14}
                fill="url(#roofGrad)"
                rx="1"
              />
            )}
          </>
        ) : (
          // Traditional pitched roof
          <>
            <polygon 
              points={`
                ${cx - baseWidth/2 - 5},${groundY - baseHeight} 
                ${cx},${groundY - baseHeight - 25 * houseScale} 
                ${cx + baseWidth/2 + 5},${groundY - baseHeight}
              `}
              fill="url(#roofGrad)"
              stroke={ageDecay > 0.5 ? '#4A3A2A' : '#6B4423'}
              strokeWidth="0.5"
            />
            {/* Missing shingles for very old houses */}
            {ageDecay > 0.7 && (
              <g opacity="0.5">
                <rect x={cx - 15} y={groundY - baseHeight - 10} width="4" height="3" fill="#1a1a1a" />
                <rect x={cx + 8} y={groundY - baseHeight - 15} width="3" height="2" fill="#1a1a1a" />
              </g>
            )}
          </>
        )}
        
        {/* Chimney for traditional houses */}
        {(style === 'suburban' || style === 'modest') && medInc > 3 && (
          <rect 
            x={cx + baseWidth/4} 
            y={groundY - baseHeight - 20 * houseScale} 
            width={8} 
            height={18 * houseScale} 
            fill={ageDecay > 0.5 ? '#6A5A4A' : '#8B4513'}
            stroke={ageDecay > 0.5 ? '#4A3A2A' : '#654321'}
            strokeWidth="0.5"
          />
        )}

        {/* Door */}
        <rect 
          x={cx - 6} 
          y={groundY - 22} 
          width={12} 
          height={22} 
          fill="url(#doorGrad)"
          rx={style === 'modern' ? 0 : 1}
        />
        {/* Door handle */}
        <circle cx={cx + 3} cy={groundY - 11} r="1.2" fill={ageDecay > 0.5 ? '#B8A060' : '#FFD700'} />
        {/* Door window for luxury */}
        {style === 'luxury' && (
          <rect x={cx - 4} y={groundY - 19} width={8} height={6} fill="url(#windowGrad)" rx="0.5" opacity="0.7" />
        )}
        
        {/* Windows - uniform style, equally spaced, constrained to house body */}
        <g filter="url(#windowReflect)">
          {(() => {
            // Calculate window size relative to house width
            const houseBodyWidth = baseWidth - 20; // Leave margin for walls
            const doorWidth = 14; // Space for door in center
            const availableWidth = houseBodyWidth - doorWidth; // Width available for windows
            
            // Determine window size based on how many we need to fit
            const windowWidth = Math.min(10, availableWidth / (numWindows + 1));
            const windowHeight = windowWidth * 1.2;
            
            // Windows go on either side of the door
            const leftSideWindows = Math.ceil(numWindows / 2);
            const rightSideWindows = Math.floor(numWindows / 2);
            
            const leftStartX = cx - baseWidth/2 + 6;
            const rightStartX = cx + 8; // After door
            const row1Y = groundY - baseHeight + 10;
            
            // Calculate gaps
            const leftWidth = (baseWidth/2 - 14); // Left side width (minus door area)
            const rightWidth = (baseWidth/2 - 14); // Right side width
            const leftGap = leftSideWindows > 1 ? (leftWidth - leftSideWindows * windowWidth) / (leftSideWindows - 1) : 0;
            const rightGap = rightSideWindows > 1 ? (rightWidth - rightSideWindows * windowWidth) / (rightSideWindows - 1) : 0;
            
            const windows = [];
            let brokenWindowX = null;
            let brokenWindowY = row1Y;
            
            // Left side windows
            for (let i = 0; i < leftSideWindows; i++) {
              const wx = leftStartX + i * (windowWidth + Math.max(leftGap, 2));
              // Make sure window doesn't extend past door area
              if (wx + windowWidth < cx - 7) {
                windows.push(
                  <g key={`wl-${i}`}>
                    <rect x={wx} y={row1Y} width={windowWidth} height={windowHeight} fill="url(#windowGrad)" rx="1" />
                    <line x1={wx + windowWidth/2} y1={row1Y} x2={wx + windowWidth/2} y2={row1Y + windowHeight} stroke="white" strokeWidth="0.8" opacity="0.6" />
                    <line x1={wx} y1={row1Y + windowHeight/2} x2={wx + windowWidth} y2={row1Y + windowHeight/2} stroke="white" strokeWidth="0.8" opacity="0.6" />
                  </g>
                );
                if (i === leftSideWindows - 1) {
                  brokenWindowX = wx;
                }
              }
            }
            
            // Right side windows
            for (let i = 0; i < rightSideWindows; i++) {
              const wx = rightStartX + i * (windowWidth + Math.max(rightGap, 2));
              // Make sure window doesn't extend past house edge
              if (wx + windowWidth <= cx + baseWidth/2 - 4) {
                windows.push(
                  <g key={`wr-${i}`}>
                    <rect x={wx} y={row1Y} width={windowWidth} height={windowHeight} fill="url(#windowGrad)" rx="1" />
                    <line x1={wx + windowWidth/2} y1={row1Y} x2={wx + windowWidth/2} y2={row1Y + windowHeight} stroke="white" strokeWidth="0.8" opacity="0.6" />
                    <line x1={wx} y1={row1Y + windowHeight/2} x2={wx + windowWidth} y2={row1Y + windowHeight/2} stroke="white" strokeWidth="0.8" opacity="0.6" />
                  </g>
                );
              }
            }
            
            // Broken/boarded window for very old houses - positioned on actual window
            if (ageDecay > 0.8 && numWindows >= 2 && brokenWindowX !== null) {
              windows.push(
                <g key="broken">
                  <line x1={brokenWindowX} y1={brokenWindowY} x2={brokenWindowX + windowWidth} y2={brokenWindowY + windowHeight} stroke="#5A4A3A" strokeWidth="2" />
                  <line x1={brokenWindowX} y1={brokenWindowY + windowHeight} x2={brokenWindowX + windowWidth} y2={brokenWindowY} stroke="#5A4A3A" strokeWidth="2" />
                </g>
              );
            }
            
            return windows;
          })()}
        </g>

        {/* Garage for higher income */}
        {incomeLevel >= 2 && (
          <g>
            <rect x={cx + baseWidth/2 + 3} y={groundY - 28} width={20} height={28} fill="url(#wallGrad)" stroke={ageDecay > 0.5 ? '#8A7A6A' : '#CBD5E0'} strokeWidth="0.5" />
            <rect x={cx + baseWidth/2 + 5} y={groundY - 22} width={16} height={22} fill={ageDecay > 0.5 ? '#3A3A3A' : '#4A5568'} rx="1" />
            <line x1={cx + baseWidth/2 + 5} y1={groundY - 11} x2={cx + baseWidth/2 + 21} y2={groundY - 11} stroke="#718096" strokeWidth="1" />
          </g>
        )}
      </g>

      {/* Bushes/Garden - less maintained for old houses */}
      {ageDecay < 0.7 && (
        <>
          <ellipse cx={cx - baseWidth/2 - 8} cy={groundY - 3} rx="8" ry="6" fill="#228B22" opacity="0.8" />
          <ellipse cx={cx + baseWidth/2 + 8} cy={groundY - 3} rx="7" ry="5" fill="#2E8B57" opacity="0.8" />
        </>
      )}
      {ageDecay >= 0.7 && (
        <>
          <ellipse cx={cx - baseWidth/2 - 8} cy={groundY - 2} rx="10" ry="5" fill="#4A6A3A" opacity="0.6" />
          <ellipse cx={cx + baseWidth/2 + 8} cy={groundY - 2} rx="9" ry="4" fill="#3A5A2A" opacity="0.6" />
        </>
      )}
      {incomeLevel >= 2 && ageDecay < 0.5 && (
        <>
          <ellipse cx={cx - baseWidth/2 - 2} cy={groundY - 2} rx="5" ry="4" fill="#32CD32" opacity="0.7" />
          <ellipse cx={cx + baseWidth/2 + 2} cy={groundY - 2} rx="5" ry="4" fill="#32CD32" opacity="0.7" />
        </>
      )}

      {/* People in yard - supports up to 10, arranged in two rows */}
      <g>
        {Array.from({ length: numPeople }).map((_, i) => {
          const row = Math.floor(i / 5);
          const col = i % 5;
          const px = 200 - 15 - col * 14; // Start from right side
          const py = 168 + row * 10; // Second row lower
          const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'];
          return (
            <g key={i} transform={`translate(${px}, ${py})`}>
              <circle cx="0" cy="-4" r="3" fill="#FBBF77" />
              <ellipse cx="0" cy="3" rx="3" ry="5" fill={colors[i % colors.length]} />
            </g>
          );
        })}
      </g>

      {/* Info badges - only income indicator, no age text */}
      <g>
        {/* Income indicator */}
        <rect x="5" y="5" width={35 + incomeLevel * 8} height="16" rx="8" fill="rgba(16, 185, 129, 0.9)" />
        <text x="12" y="16" fontSize="10" fill="white" fontWeight="bold">
          {'$'.repeat(Math.max(1, Math.ceil(incomeLevel)))}
        </text>
      </g>
    </svg>
  );
}

// California map - projected from real lat/lon so cities and the pin line up
function CaliforniaMap({ latitude, longitude, onSelectLocation }) {
  const bounds = { latMin: 32.45, latMax: 42.05, lonMin: -124.55, lonMax: -114.1 };
  const width = 80;
  const height = 120;
  const padding = 6;
  const svgRef = useRef(null);
  const isDragging = useRef(false);

  const project = (lat, lon) => {
    const x = padding + ((lon - bounds.lonMin) / (bounds.lonMax - bounds.lonMin)) * (width - padding * 2);
    const y = padding + ((bounds.latMax - lat) / (bounds.latMax - bounds.latMin)) * (height - padding * 2);
    return { x, y };
  };

  const outlineLatLng = [
    { lat: 42.0, lon: -124.4 },
    { lat: 41.5, lon: -124.1 },
    { lat: 40.8, lon: -123.9 },
    { lat: 39.8, lon: -123.8 },
    { lat: 38.7, lon: -123.3 },
    { lat: 37.8, lon: -122.6 },
    { lat: 36.8, lon: -121.9 },
    { lat: 36.0, lon: -121.5 },
    { lat: 34.5, lon: -120.6 },
    { lat: 33.9, lon: -118.6 },
    { lat: 33.5, lon: -117.6 },
    { lat: 32.7, lon: -117.1 },
    { lat: 32.45, lon: -117.0 },
    { lat: 32.45, lon: -114.1 },
    { lat: 34.8, lon: -114.1 },
    { lat: 36.0, lon: -114.8 },
    { lat: 37.0, lon: -117.1 },
    { lat: 38.5, lon: -118.2 },
    { lat: 39.5, lon: -120.0 },
    { lat: 41.2, lon: -120.0 },
    { lat: 42.0, lon: -120.0 },
  ];

  const outlinePath =
    outlineLatLng
      .map(({ lat, lon }, idx) => {
        const { x, y } = project(lat, lon);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ') + ' Z';

  const cities = [
    { name: 'San Francisco', lat: 37.77, lon: -122.42, type: 'circle' },
    { name: 'Sacramento', lat: 38.58, lon: -121.49, type: 'triangle' },
    { name: 'Los Angeles', lat: 34.05, lon: -118.24, type: 'circle' },
    { name: 'San Diego', lat: 32.72, lon: -117.16, type: 'circle' },
  ].map((city) => ({
    ...city,
    point: project(city.lat, city.lon),
  }));

  const { x: markerX, y: markerY } = project(latitude, longitude);

  const updateFromPointer = (clientX, clientY) => {
    if (!onSelectLocation || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relativeX = ((clientX - rect.left) / rect.width) * width;
    const relativeY = ((clientY - rect.top) / rect.height) * height;

    const clampedX = Math.max(padding, Math.min(width - padding, relativeX));
    const clampedY = Math.max(padding, Math.min(height - padding, relativeY));

    const lon = bounds.lonMin + ((clampedX - padding) / (width - padding * 2)) * (bounds.lonMax - bounds.lonMin);
    const lat = bounds.latMax - ((clampedY - padding) / (height - padding * 2)) * (bounds.latMax - bounds.latMin);

    onSelectLocation({
      latitude: parseFloat(lat.toFixed(2)),
      longitude: parseFloat(lon.toFixed(2)),
    });
  };

  const handleMouseDown = (event) => {
    isDragging.current = true;
    updateFromPointer(event.clientX, event.clientY);
  };

  const handleMouseMove = (event) => {
    if (!isDragging.current) return;
    event.preventDefault();
    updateFromPointer(event.clientX, event.clientY);
  };

  const stopDragging = () => {
    isDragging.current = false;
  };

  const handleTouchStart = (event) => {
    if (event.touches.length === 0) return;
    isDragging.current = true;
    updateFromPointer(event.touches[0].clientX, event.touches[0].clientY);
  };

  const handleTouchMove = (event) => {
    if (!isDragging.current || event.touches.length === 0) return;
    event.preventDefault();
    updateFromPointer(event.touches[0].clientX, event.touches[0].clientY);
  };

  const handleTouchEnd = () => stopDragging();

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      ref={svgRef}
      className="w-full h-full cursor-pointer select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDragging}
      onMouseLeave={stopDragging}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <defs>
        <linearGradient id="oceanGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1565C0" />
          <stop offset="100%" stopColor="#0D47A1" />
        </linearGradient>
        <linearGradient id="caGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C8A2B0" />
          <stop offset="100%" stopColor="#B8929F" />
        </linearGradient>
      </defs>
      
      <rect x="0" y="0" width={width} height={height} fill="url(#oceanGrad2)" rx="5" />
      
      <path
        d={outlinePath}
        fill="url(#caGrad)"
        stroke="#8B6B7A"
        strokeWidth="0.8"
      />
      <path d={outlinePath} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.3" />
      
      {cities.map((city) => (
        <g key={city.name}>
          {city.type === 'triangle' ? (
            <polygon
              points={`${city.point.x},${city.point.y - 1.8} ${city.point.x - 1.4},${city.point.y + 1.2} ${city.point.x + 1.4},${city.point.y + 1.2}`}
              fill="#0f172a"
            />
          ) : (
            <circle cx={city.point.x} cy={city.point.y} r="1.3" fill="#0f172a" />
          )}
          <text
            x={city.point.x + 2.2}
            y={city.point.y + 1}
            fontSize="3"
            fill="#1f2937"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {city.name}
          </text>
        </g>
      ))}
      
      <g>
        <ellipse cx={markerX} cy={markerY + 2} rx="1.8" ry="0.8" fill="rgba(0,0,0,0.25)" />
        <circle cx={markerX} cy={markerY} r="2.6" fill="#EF4444" stroke="#991B1B" strokeWidth="0.6" />
        <circle cx={markerX} cy={markerY} r="1.2" fill="white" />
      </g>
    </svg>
  );
}

const CaliforniaHousingInput = ({ onInputChange }) => {
  const [values, setValues] = useState(
    HOUSING_FEATURES.reduce((acc, f) => ({ ...acc, [f.name]: f.default }), {})
  );
  const onInputChangeRef = useRef(onInputChange);
  
  // Keep callback ref up to date
  useEffect(() => {
    onInputChangeRef.current = onInputChange;
  }, [onInputChange]);

  useEffect(() => {
    const inputArray = HOUSING_FEATURES.map(f => values[f.name]);
    onInputChangeRef.current(inputArray);
  }, [values]);

  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: parseFloat(value) }));
  };

  const presets = {
    'Los Angeles': { latitude: 34.05, longitude: -118.25, medInc: 4.5, population: 3000, houseAge: 35, avgRooms: 5, avgBedrooms: 2, avgOccup: 3 },
    'San Francisco': { latitude: 37.77, longitude: -122.42, medInc: 8.5, population: 2000, houseAge: 45, avgRooms: 4, avgBedrooms: 1.5, avgOccup: 2 },
    'San Diego': { latitude: 32.72, longitude: -117.16, medInc: 5.5, population: 1500, houseAge: 20, avgRooms: 6, avgBedrooms: 3, avgOccup: 3.5 },
  };

  const renderValue = (feature, value) => {
    if (feature.name === 'medInc') {
      const dollars = value * 10000;
      return (
        <span className="text-[11px] text-emerald-400 font-mono bg-gray-800/80 px-2 py-0.5 rounded">
          ${dollars.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
      );
    }

    return (
      <span className="text-[11px] text-amber-400 font-mono bg-gray-800/80 px-2 py-0.5 rounded">
        {value.toFixed(feature.step >= 1 ? 0 : 1)}
        {feature.unit ? ` ${feature.unit}` : ''}
      </span>
    );
  };

  return (
    <div className="space-y-2">
      {/* Visual Display */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.75fr_1fr] gap-2 items-stretch">
        {/* House Visualization */}
        <div className="relative rounded-xl border border-gray-700/50 bg-gradient-to-b from-gray-800/80 to-gray-900/80 overflow-hidden shadow-lg aspect-[10/9] max-h-[260px] w-full mx-auto">
          <div className="w-full h-full flex items-center justify-center">
            <HouseVisualization
              medInc={values.medInc}
              houseAge={values.houseAge}
              avgRooms={values.avgRooms}
              avgBedrooms={values.avgBedrooms}
              avgOccup={values.avgOccup}
              population={values.population}
            />
          </div>
        </div>
        
        {/* California Map */}
        <div className="relative rounded-xl border border-gray-700/50 bg-gradient-to-b from-gray-800/80 to-gray-900/80 overflow-hidden shadow-lg aspect-[2/3] max-h-[260px] w-full mx-auto flex flex-col">
          <div className="flex-1 p-1.5 flex items-center justify-center">
            <CaliforniaMap
              latitude={values.latitude}
              longitude={values.longitude}
              onSelectLocation={({ latitude, longitude }) => {
                setValues((prev) => ({ ...prev, latitude, longitude }));
              }}
            />
          </div>
          <div className="pb-1 px-2 flex justify-center">
            <span className="text-[9px] leading-tight text-gray-300 bg-gray-900/80 px-2 py-0.5 rounded whitespace-nowrap">
              {values.latitude.toFixed(1)}°N, {Math.abs(values.longitude).toFixed(1)}°W
            </span>
          </div>
          <div className="text-center text-[8px] text-blue-300 pb-1">Click or drag on the map</div>
        </div>
      </div>

      {/* Presets */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-400">Presets</span>
        <div className="flex gap-1.5 flex-wrap">
          {Object.entries(presets).map(([name, preset]) => (
            <button
              key={name}
              onClick={() => setValues(prev => ({ ...prev, ...preset }))}
              className="px-2.5 py-1 text-[10px] bg-gradient-to-r from-blue-600/80 to-blue-700/80 hover:from-blue-500 hover:to-blue-600 text-white rounded-full transition-all shadow-sm"
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Sliders */}
      <div className="grid grid-cols-2 gap-1.5">
        {HOUSING_FEATURES.map((feature) => {
          const isMoney = feature.name === 'medInc';
          const isLocation = feature.name === 'latitude' || feature.name === 'longitude';
          const colorClass = isLocation ? 'accent-red-400' : (isMoney ? 'accent-emerald-400' : 'accent-amber-400');
          
          return (
            <div key={feature.name} className="space-y-0.5 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <label className="text-[10px] text-gray-300 truncate">{feature.label}</label>
                {renderValue(feature, values[feature.name])}
              </div>
              <input
                type="range"
                min={feature.min}
                max={feature.max}
                step={feature.step}
                value={values[feature.name]}
                onChange={(e) => handleChange(feature.name, e.target.value)}
                className={`w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer ${colorClass}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CaliforniaHousingInput;
