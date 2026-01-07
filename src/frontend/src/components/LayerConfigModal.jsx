import { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import Tooltip from './Tooltip';

// All layer types
const ALL_LAYER_TYPES = [
  { value: 'dense', label: 'Dense (Fully Connected)', requiresImage: false },
  { value: 'conv2d', label: 'Conv2D (Convolutional)', requiresImage: true },
  { value: 'maxpooling2d', label: 'MaxPooling2D', requiresImage: true },
  { value: 'dropout', label: 'Dropout', requiresImage: false },
  { value: 'flatten', label: 'Flatten', requiresImage: true },
];

// Image datasets that support Conv2D/Pooling layers
const IMAGE_DATASETS = ['mnist'];

const ACTIVATION_FUNCTIONS = [
  'relu',
  'sigmoid',
  'tanh',
  'softmax',
  'linear',
  'elu',
  'selu',
];

const LAYER_TYPE_DETAILS = {
  dense: {
    title: 'Dense',
    description: 'Fully connected layer',
  },
  conv2d: {
    title: 'Conv2D',
    description: 'Learns spatial filters',
  },
  maxpooling2d: {
    title: 'MaxPooling',
    description: 'Downsamples feature maps',
  },
  dropout: {
    title: 'Dropout',
    description: 'Randomly zeros activations',
  },
  flatten: {
    title: 'Flatten',
    description: 'Flattens spatial dimensions',
  },
};

const ACTIVATION_DETAILS = {
  relu: {
    label: 'ReLU',
    description: 'Zeroes negatives, keeps positives',
    fn: (x) => Math.max(0, x),
  },
  sigmoid: {
    label: 'Sigmoid',
    description: 'Squashes values into (0,1)',
    fn: (x) => 1 / (1 + Math.exp(-x)),
  },
  tanh: {
    label: 'Tanh',
    description: 'Smooth curve from -1 to 1',
    fn: (x) => Math.tanh(x),
  },
  softmax: {
    label: 'Softmax',
    description: 'Two-class slice of softmax',
    fn: (x) => {
      const ex = Math.exp(x);
      return ex / (ex + 1);
    },
  },
  linear: {
    label: 'Linear',
    description: 'Pass-through, no squashing',
    fn: (x) => x,
  },
  elu: {
    label: 'ELU',
    description: 'Exponential for negatives, linear otherwise',
    fn: (x) => (x >= 0 ? x : Math.exp(x) - 1),
  },
  selu: {
    label: 'SELU',
    description: 'Scaled ELU for self-normalizing nets',
    fn: (x) => {
      const lambda = 1.0507;
      const alpha = 1.67326;
      return x >= 0 ? lambda * x : lambda * alpha * (Math.exp(x) - 1);
    },
  },
};

const generateActivationData = (fn) => {
  const points = [];
  for (let x = -5; x <= 5; x += 0.5) {
    points.push({
      x: Number(x.toFixed(2)),
      y: Number(fn(x).toFixed(4)),
    });
  }
  return points;
};

const getYDomain = (data) => {
  const ys = data.map((point) => point.y);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const padding = (max - min) * 0.2 || 1;
  return [min - padding, max + padding];
};

const InfoDot = ({ text, position = 'top' }) => (
  <Tooltip text={text} position={position}>
    <span className="w-4 h-4 rounded-full border border-blue-500/50 text-blue-200 flex items-center justify-center text-[10px] bg-blue-900/30">
      ?
    </span>
  </Tooltip>
);

const ActivationSelector = ({ value, onChange }) => {
  const curves = useMemo(() => {
    const built = {};
    Object.entries(ACTIVATION_DETAILS).forEach(([key, detail]) => {
      built[key] = generateActivationData(detail.fn);
    });
    return built;
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <label className="block text-sm font-medium text-gray-300">
            Activation Function
          </label>
          <InfoDot
            text="Non-linear squashing applied after the layer. Try ReLU for most cases, softmax on outputs, and sigmoid/tanh for bounded activations."
            position="top"
          />
        </div>
        <span className="text-xs text-gray-400">Previews with curves</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {ACTIVATION_FUNCTIONS.map((act) => {
          const chartData = curves[act] || [];
          const detail = ACTIVATION_DETAILS[act];
          const domain = chartData.length ? getYDomain(chartData) : [-1, 1];
          return (
            <button
              key={act}
              type="button"
              onClick={() => onChange(act)}
              className={`p-2.5 rounded-lg border transition-colors text-left bg-gray-750 h-[108px] flex flex-col ${
                value === act
                  ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="mb-1 flex-shrink-0">
                <div className="text-xs font-semibold text-white leading-tight">{detail?.label || act}</div>
                <div className="text-[11px] text-gray-400 leading-tight">{detail?.description}</div>
              </div>
              <div className="h-16 bg-gray-800 rounded-md border border-gray-700">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <XAxis dataKey="x" hide />
                    <YAxis domain={domain} hide />
                    <ReferenceLine y={0} stroke="#4B5563" strokeWidth={1} />
                    <ReferenceLine x={0} stroke="#4B5563" strokeWidth={1} />
                    <Line
                      type="monotone"
                      dataKey="y"
                      stroke={value === act ? '#60a5fa' : '#9ca3af'}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const LayerVisual = ({ type }) => {
  switch (type) {
    case 'dense':
      return (
        <div className="h-full flex flex-col justify-center gap-1">
          {[80, 60, 40].map((w, idx) => (
            <div
              key={idx}
              className="h-2 rounded bg-blue-400/70"
              style={{ width: `${w}%`, marginLeft: `${idx * 6}%` }}
            />
          ))}
        </div>
      );
    case 'conv2d':
      return (
        <div className="grid grid-cols-4 grid-rows-3 gap-1 h-full">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div
              key={idx}
              className={`rounded ${idx % 5 === 0 ? 'bg-purple-400/80' : 'bg-purple-300/50'}`}
            />
          ))}
        </div>
      );
    case 'maxpooling2d':
      return (
        <div className="grid grid-cols-3 grid-rows-3 gap-1 h-full">
          {Array.from({ length: 9 }).map((_, idx) => (
            <div
              key={idx}
              className={`rounded ${
                idx === 4 ? 'bg-emerald-400/80' : 'bg-emerald-300/40 border border-emerald-400/40'
              }`}
            />
          ))}
        </div>
      );
    case 'dropout':
      return (
        <div className="h-full grid grid-cols-6 grid-rows-4 gap-1 items-center">
          {Array.from({ length: 24 }).map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 w-1.5 rounded-full ${
                idx % 4 === 0 ? 'bg-amber-400/80' : 'bg-amber-200/50'
              }`}
            />
          ))}
        </div>
      );
    case 'flatten':
      return (
        <div className="h-full flex items-center">
          <div className="h-3 w-full rounded-full bg-orange-400/70" />
        </div>
      );
    default:
      return <div className="h-full flex items-center justify-center text-gray-500 text-xs">Preview</div>;
  }
};

const LayerTypeSelector = ({ value, onChange, options }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <label className="block text-sm font-medium text-gray-300">Layer Type</label>
        <InfoDot
          text="Choose how this layer transforms data. Dense works everywhere, Conv2D/Pooling are for images, Dropout regularizes, Flatten connects image features to dense layers."
          position="top"
        />
      </div>
      <span className="text-xs text-gray-400">Tap to preview</span>
    </div>
    <div className="grid grid-cols-3 gap-2">
      {options.map((opt) => {
        const detail = LAYER_TYPE_DETAILS[opt.value] || {};
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`p-2.5 rounded-lg border text-left transition-colors bg-gray-750 h-[120px] flex flex-col ${
              value === opt.value
                ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="mb-1">
              <div className="text-xs font-semibold text-white leading-tight">{detail.title || opt.label}</div>
              <div className="text-[11px] text-gray-400 leading-tight">{detail.description || opt.label}</div>
            </div>
            <div className="h-14 bg-gray-800 rounded-md border border-gray-700 p-2">
              <LayerVisual type={opt.value} />
            </div>
            <div className="mt-1 h-4">
              {opt.requiresImage && (
                <div className="text-[11px] text-amber-300">Image datasets only</div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

const LayerConfigModal = ({ layer, onSave, onClose, selectedDataset }) => {
  // Filter layer types based on whether an image dataset is selected
  const isImageDataset = selectedDataset && IMAGE_DATASETS.includes(selectedDataset.id);
  
  const availableLayerTypes = useMemo(() => {
    return ALL_LAYER_TYPES.filter(type => !type.requiresImage || isImageDataset);
  }, [isImageDataset]);

  const [config, setConfig] = useState({
    type: 'dense',
    units: 8,
    activation: 'relu',
    filters: 32,
    kernelSize: 3,
    poolSize: 2,
    rate: 0.2,
  });

  useEffect(() => {
    if (layer) {
      setConfig({
        type: layer.type || 'dense',
        units: layer.units || 8,
        activation: layer.activation || 'relu',
        filters: layer.filters || 32,
        kernelSize: layer.kernelSize || 3,
        poolSize: layer.poolSize || 2,
        rate: layer.rate || 0.2,
      });
    }
  }, [layer]);

  // Reset type to dense if the current type isn't available for this dataset
  useEffect(() => {
    const currentTypeAvailable = availableLayerTypes.some(t => t.value === config.type);
    if (!currentTypeAvailable) {
      setConfig(prev => ({ ...prev, type: 'dense' }));
    }
  }, [availableLayerTypes, config.type]);

  // Close on Escape for quicker dismissal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Build layer config based on type
    const layerConfig = { type: config.type };

    switch (config.type) {
      case 'dense':
        layerConfig.units = parseInt(config.units);
        layerConfig.activation = config.activation;
        break;
      case 'conv2d':
        layerConfig.filters = parseInt(config.filters);
        layerConfig.kernelSize = parseInt(config.kernelSize);
        layerConfig.activation = config.activation;
        break;
      case 'maxpooling2d':
        layerConfig.poolSize = parseInt(config.poolSize);
        break;
      case 'dropout':
        layerConfig.rate = parseFloat(config.rate);
        break;
      case 'flatten':
        // No additional config needed
        break;
      default:
        break;
    }

    onSave(layerConfig);
  };

  const renderTypeSpecificFields = () => {
    switch (config.type) {
      case 'dense':
        return (
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <label className="block text-sm font-medium text-gray-300">
                  Units (Neurons)
                </label>
                <InfoDot
                  text="How many neurons this layer outputs. More units let it learn richer patterns but increase parameters."
                  position="top"
                />
              </div>
              <input
                type="number"
                value={config.units}
                onChange={(e) => handleChange('units', e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>
            <ActivationSelector
              value={config.activation}
              onChange={(value) => handleChange('activation', value)}
            />
          </div>
        );

      case 'conv2d':
        return (
          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <label className="block text-sm font-medium text-gray-300">
                    Filters
                  </label>
                  <InfoDot
                    text="Number of convolution filters to learn. Each filter detects a pattern; more filters capture more visual features."
                    position="top"
                  />
                </div>
                <input
                  type="number"
                  value={config.filters}
                  onChange={(e) => handleChange('filters', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <label className="block text-sm font-medium text-gray-300">
                    Kernel Size
                  </label>
                  <InfoDot
                    text="The spatial window the filter slides over (e.g., 3 means 3x3). Larger kernels see more context but add cost."
                    position="top"
                  />
                </div>
                <input
                  type="number"
                  value={config.kernelSize}
                  onChange={(e) => handleChange('kernelSize', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
            </div>
            <ActivationSelector
              value={config.activation}
              onChange={(value) => handleChange('activation', value)}
            />
          </div>
        );

      case 'maxpooling2d':
        return (
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <label className="block text-sm font-medium text-gray-300">
                  Pool Size
                </label>
                <InfoDot
                  text="Window size for downsampling. A 2 means a 2x2 pool that cuts the feature map dimensions in half."
                  position="top"
                />
              </div>
              <input
                type="number"
                value={config.poolSize}
                onChange={(e) => handleChange('poolSize', e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>
          </div>
        );

      case 'dropout':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 mb-1">
              <label className="block text-sm font-medium text-gray-300">
                Dropout Rate (0-1)
              </label>
              <InfoDot
                text="Fraction of activations randomly zeroed during training to fight overfitting. Common values are 0.2–0.5."
                position="top"
              />
            </div>
            <input
              type="number"
              value={config.rate}
              onChange={(e) => handleChange('rate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              max="1"
              step="0.01"
            />
          </div>
        );

      case 'flatten':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-400 italic flex items-center gap-1.5">
              <InfoDot
                text="Collapse spatial dimensions (height/width/channels) into a 1D vector so you can feed images into dense layers."
                position="top"
              />
              Flatten layer has no configurable parameters.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl mx-4 border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            {layer ? 'Edit Layer' : 'Add Layer'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Layer Type */}
            <div className="space-y-3 min-h-[420px]">
              <LayerTypeSelector
                value={config.type}
                onChange={(value) => handleChange('type', value)}
                options={availableLayerTypes}
              />
              {!isImageDataset && (
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <InfoDot
                    text="Image-friendly layers expect 2D structure like pixels. Pick MNIST or another image dataset to unlock them."
                    position="right"
                  />
                  Conv2D, Pooling, and Flatten layers require an image dataset (e.g., MNIST)
                </p>
              )}
            </div>

            {/* Type-specific fields */}
            <div className="space-y-3 min-h-[420px]">
              {renderTypeSpecificFields()}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {layer ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LayerConfigModal;
