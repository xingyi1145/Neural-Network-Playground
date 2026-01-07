import { useState, useEffect, useRef } from 'react';

const DefaultInput = ({ onInputChange, numFeatures = 1 }) => {
  const [values, setValues] = useState(Array(numFeatures).fill(0));
  const [inputText, setInputText] = useState('');
  const onInputChangeRef = useRef(onInputChange);
  
  // Keep callback ref up to date
  useEffect(() => {
    onInputChangeRef.current = onInputChange;
  }, [onInputChange]);

  useEffect(() => {
    if (values.some(v => v !== 0)) {
      onInputChangeRef.current(values);
    }
  }, [values]);

  const handleTextChange = (text) => {
    setInputText(text);
    
    try {
      // Try parsing as JSON array
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        setValues(parsed.map(Number));
      }
    } catch {
      // Try parsing as comma-separated values
      const parts = text.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
      if (parts.length > 0) {
        setValues(parts);
      }
    }
  };

  const handleRandomize = () => {
    const randomValues = Array(numFeatures).fill(0).map(() => 
      parseFloat((Math.random() * 2 - 1).toFixed(3))
    );
    setValues(randomValues);
    setInputText(JSON.stringify(randomValues));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">
          Test Input ({numFeatures} features)
        </label>
        <button
          onClick={handleRandomize}
          className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
        >
          Random
        </button>
      </div>
      
      <textarea
        value={inputText}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder={`Enter ${numFeatures} values (e.g., 1.5, 2.3, 4.1 or [1.5, 2.3, 4.1])`}
        className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder-gray-400 font-mono"
        rows={3}
      />
      
      <p className="text-xs text-gray-400">
        Enter comma-separated values or JSON array
      </p>
      
      {values.length > 0 && values.some(v => v !== 0) && (
        <div className="p-3 bg-gray-750 rounded-lg border border-gray-600">
          <p className="text-xs text-gray-400 mb-1">Parsed values:</p>
          <p className="text-sm text-blue-400 font-mono break-all">
            [{values.map(v => v.toFixed(3)).join(', ')}]
          </p>
        </div>
      )}
    </div>
  );
};

export default DefaultInput;







