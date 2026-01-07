const ACTIVATION_MAP = {
  relu: 'nn.ReLU()',
  sigmoid: 'nn.Sigmoid()',
  tanh: 'nn.Tanh()',
  softmax: 'nn.Softmax(dim=1)',
  linear: '',
  elu: 'nn.ELU()',
  selu: 'nn.SELU()',
};

const toPositiveInt = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return Math.round(num);
};

const clampRate = (value, fallback = 0.5) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(Math.max(num, 0), 1);
};

const activationLayer = (activation) => {
  const key = (activation || '').toString().trim().toLowerCase();
  return ACTIVATION_MAP[key] || '';
};

const flattenLine = '            nn.Flatten(),';

export const generateModelPy = ({
  layers = [],
  inputFeatures,
  outputFeatures,
  taskType = 'classification',
  datasetName,
}) => {
  const inputDim = toPositiveInt(Array.isArray(inputFeatures)
    ? inputFeatures.reduce((acc, dim) => acc * (Number(dim) || 1), 1)
    : inputFeatures);
  const outputDim = toPositiveInt(outputFeatures);

  if (!inputDim || !outputDim) {
    throw new Error('Input/output dimensions are missing. Pick a dataset to set them before exporting.');
  }

  const seqLines = [];
  let prevFeatures = inputDim;
  let currentChannels = 1;
  let sawSpatial = false;
  let flattened = false;
  const normalizedTask = (taskType || 'classification').toString().toLowerCase();

  layers.forEach((layer) => {
    const type = (layer?.type || '').toString().toLowerCase();
    switch (type) {
      case 'conv2d': {
        const filters = toPositiveInt(layer.filters);
        const kernel = toPositiveInt(layer.kernelSize) || 3;
        const stride = toPositiveInt(layer.stride) || 1;
        // Default to same-padding for odd kernels to preserve MNIST spatial dims
        const padding = Number.isInteger(kernel) ? Math.floor(kernel / 2) : 0;
        if (!filters) {
          throw new Error('Conv2D layer is missing filter count.');
        }
        seqLines.push(`            nn.Conv2d(${currentChannels}, ${filters}, kernel_size=${kernel}, stride=${stride}, padding=${padding}),`);
        currentChannels = filters;
        sawSpatial = true;
        prevFeatures = null;
        const act = activationLayer(layer.activation);
        if (act) seqLines.push(`            ${act},`);
        break;
      }
      case 'maxpooling2d': {
        const pool = toPositiveInt(layer.poolSize) || 2;
        const poolStride = toPositiveInt(layer.stride) || pool;
        seqLines.push(`            nn.MaxPool2d(kernel_size=${pool}, stride=${poolStride}),`);
        sawSpatial = true;
        prevFeatures = null;
        break;
      }
      case 'flatten': {
        seqLines.push(flattenLine);
        flattened = true;
        break;
      }
      case 'dropout': {
        const rate = clampRate(layer.rate, 0.5);
        seqLines.push(`            nn.Dropout(p=${rate}),`);
        break;
      }
      case 'dense': {
        if (sawSpatial && !flattened) {
          seqLines.push(flattenLine);
          flattened = true;
        }
        const units = toPositiveInt(layer.units);
        if (!units) {
          throw new Error('Dense layer is missing a unit count.');
        }
        const linear = prevFeatures
          ? `nn.Linear(${prevFeatures}, ${units})`
          : `nn.LazyLinear(${units})`;
        seqLines.push(`            ${linear},`);
        prevFeatures = units;
        const act = activationLayer(layer.activation);
        if (act) seqLines.push(`            ${act},`);
        break;
      }
      default:
        break;
    }
  });

  if (sawSpatial && !flattened) {
    seqLines.push(flattenLine);
    flattened = true;
  }

  const outputLinear = prevFeatures
    ? `nn.Linear(${prevFeatures}, ${outputDim})`
    : `nn.LazyLinear(${outputDim})`;
  seqLines.push(`            ${outputLinear},`);
  if (normalizedTask === 'classification' && outputDim > 1) {
    seqLines.push('            nn.Softmax(dim=1),');
  }

  const modules = seqLines.slice();
  if (modules.length > 0) {
    const lastIdx = modules.length - 1;
    modules[lastIdx] = modules[lastIdx].replace(/,\s*$/, '');
  }

  const header = datasetName
    ? `# Auto-generated from Nurel canvas for ${datasetName}`
    : '# Auto-generated from Nurel canvas';

  return [
    'import torch',
    'import torch.nn as nn',
    '',
    header,
    `# Input dim: ${inputDim} | Output dim: ${outputDim} | Task: ${normalizedTask}`,
    '',
    'class ExportedModel(nn.Module):',
    '    def __init__(self):',
    '        super().__init__()',
    '        self.model = nn.Sequential(',
    ...modules,
    '        )',
    '',
    '    def forward(self, x):',
    '        return self.model(x)',
    '',
  ].join('\n');
};

export const downloadModelPy = (config, filename = 'model.py') => {
  const code = generateModelPy(config);
  const blob = new Blob([code], { type: 'text/x-python' });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.URL.revokeObjectURL(url);
};
