import { createContext, useContext, useState, useCallback } from 'react';

const ModelContext = createContext(null);

export const useModel = () => {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error('useModel must be used within ModelProvider');
  }
  return context;
};

const createInitialTrainingState = () => ({
  isTraining: false,
  status: 'idle', // idle | running | paused | stopped | completed | failed
  trainingId: null,
  datasetId: null,
  currentEpoch: 0,
  totalEpochs: 0,
  config: {
    epochs: 20,
    learningRate: 0.01,
    batchSize: 32,
    optimizer: 'adam'
  },
  metrics: {
    loss: [],
    accuracy: []
  }
});

const createInitialTestingState = () => ({
  inputs: null,
  outputs: null,
  isLoading: false
});

const createInitialValidationState = () => ({
  hasValidConnections: false,
  connectionError: 'No layers connected',
  warnings: []
});

export const ModelProvider = ({ children }) => {

  const [selectedDataset, setSelectedDataset] = useState(null);
  const [modelValidation, setModelValidation] = useState(createInitialValidationState);
  const [model, setModel] = useState({
    id: null,
    layers: [],
    inputShape: null,
    outputShape: null
  });
  const [training, setTraining] = useState(createInitialTrainingState);
  const [testing, setTesting] = useState(createInitialTestingState);

  // Dataset actions
  const selectDataset = useCallback((dataset) => {
    setSelectedDataset(dataset);
    // Clear stale training/testing state when switching datasets
    setTraining(prev => ({
      ...prev,
      isTraining: false,
      status: 'idle',
      trainingId: null,
      datasetId: null,
      currentEpoch: 0,
      totalEpochs: 0,
      metrics: {
        loss: [],
        accuracy: []
      }
    }));
    setTesting(createInitialTestingState());
    // Align training defaults to dataset-specific hyperparameters (e.g., MNIST prefers 4096)
    if (dataset?.hyperparameters) {
      const { epochs, learning_rate, batch_size, optimizer } = dataset.hyperparameters;
      setTraining(prev => {
        const nextConfig = { ...prev.config };
        let changed = false;
        if (typeof epochs === 'number' && prev.config.epochs !== epochs) {
          nextConfig.epochs = epochs;
          changed = true;
        }
        if (typeof learning_rate === 'number' && prev.config.learningRate !== learning_rate) {
          nextConfig.learningRate = learning_rate;
          changed = true;
        }
        if (typeof batch_size === 'number' && prev.config.batchSize !== batch_size) {
          nextConfig.batchSize = batch_size;
          changed = true;
        }
        if (typeof optimizer === 'string' && optimizer && prev.config.optimizer !== optimizer) {
          nextConfig.optimizer = optimizer;
          changed = true;
        }
        if (!changed) return prev;
        return {
          ...prev,
          config: nextConfig
        };
      });
    }
    // Auto-set input shape from dataset
    if (dataset) {
      setModel(prev => ({
        ...prev,
        inputShape: dataset.input_shape || dataset.num_features
      }));
    }
  }, []);

  // Model actions
  const addLayer = useCallback((layerConfig) => {
    setModel(prev => ({
      ...prev,
      layers: [...prev.layers, { id: Date.now(), ...layerConfig }]
    }));
  }, []);

  const updateLayer = useCallback((layerId, config) => {
    setModel(prev => ({
      ...prev,
      layers: prev.layers.map(layer =>
        layer.id === layerId ? { ...layer, ...config } : layer
      )
    }));
  }, []);

  const removeLayer = useCallback((layerId) => {
    setModel(prev => ({
      ...prev,
      layers: prev.layers.filter(layer => layer.id !== layerId)
    }));
  }, []);

  const reorderLayers = useCallback((newLayers) => {
    setModel(prev => ({
      ...prev,
      layers: newLayers
    }));
  }, []);

  const clearModel = useCallback(() => {
    setModel({
      id: null,
      layers: [],
      inputShape: null,
      outputShape: null
    });
  }, []);

  const setLayers = useCallback((layers) => {
    setModel(prev => ({
      ...prev,
      layers: layers.map((layer, index) => ({ id: Date.now() + index, ...layer }))
    }));
  }, []);

  // Training actions
  const updateTrainingConfig = useCallback((config) => {
    setTraining(prev => ({
      ...prev,
      config: { ...prev.config, ...config }
    }));
  }, []);

  const startTraining = useCallback((trainingId, totalEpochs = 0) => {
    setTraining(prev => ({
      ...prev,
      isTraining: true,
      status: 'running',
      trainingId,
      datasetId: selectedDataset?.id || null,
      currentEpoch: 0,
      totalEpochs: totalEpochs || prev.config.epochs,
      metrics: {
        loss: [],
        accuracy: []
      }
    }));
  }, [selectedDataset?.id]);

  const stopTraining = useCallback((finalStatus = 'stopped') => {
    setTraining(prev => ({
      ...prev,
      isTraining: false,
      status: finalStatus
    }));
  }, []);

  const pauseTraining = useCallback(() => {
    setTraining(prev => ({
      ...prev,
      isTraining: true,
      status: 'paused'
    }));
  }, []);

  const resumeTraining = useCallback(() => {
    setTraining(prev => ({
      ...prev,
      isTraining: true,
      status: 'running'
    }));
  }, []);

  const updateTrainingMetrics = useCallback((newMetrics) => {
    // Ensure we have an array
    const metricsArray = Array.isArray(newMetrics) ? newMetrics : [newMetrics];

    if (metricsArray.length === 0) return;

    setTraining(prev => {
      const lastMetric = metricsArray[metricsArray.length - 1];

      // Get existing epochs to avoid duplicates
      const existingEpochs = new Set(prev.metrics.loss.map(m => m.epoch));

      // Filter to only new metrics (epochs we haven't seen)
      const newMetricsFiltered = metricsArray.filter(m => !existingEpochs.has(m.epoch));
      
      if (newMetricsFiltered.length === 0) {
        // No new metrics, just update currentEpoch
        return {
          ...prev,
          currentEpoch: lastMetric.epoch
        };
      }

      // Append only new metrics to existing history
      const newLoss = [...prev.metrics.loss];
      const newAccuracy = [...prev.metrics.accuracy];

      newMetricsFiltered.forEach(m => {
        newLoss.push({ epoch: m.epoch, value: m.loss });
        if (m.accuracy !== undefined && m.accuracy !== null) {
          newAccuracy.push({ epoch: m.epoch, value: m.accuracy });
        }
      });

      return {
        ...prev,
        currentEpoch: lastMetric.epoch,
        metrics: {
          loss: newLoss,
          accuracy: newAccuracy
        }
      };
    });
  }, []);

  const syncTrainingStatus = useCallback(({ status, current_epoch, total_epochs }) => {
    setTraining(prev => {
      const nextStatus = status || prev.status;
      const active = nextStatus === 'running' || nextStatus === 'paused';
      return {
        ...prev,
        status: nextStatus,
        isTraining: active,
        currentEpoch: typeof current_epoch === 'number' ? current_epoch : prev.currentEpoch,
        totalEpochs: typeof total_epochs === 'number' ? total_epochs : prev.totalEpochs,
      };
    });
  }, []);

  const resetTraining = useCallback(() => {
    setTraining(prev => ({
      ...createInitialTrainingState(),
      config: { ...prev.config }
    }));
    setTesting(createInitialTestingState());
  }, []);

  // Testing actions
  const setTestInputs = useCallback((inputs) => {
    setTesting(prev => ({
      ...prev,
      inputs
    }));
  }, []);

  const setTestOutputs = useCallback((outputs) => {
    setTesting(prev => ({
      ...prev,
      outputs
    }));
  }, []);

  const setTestLoading = useCallback((isLoading) => {
    setTesting(prev => ({
      ...prev,
      isLoading
    }));
  }, []);

  // Validation actions
  const updateModelValidation = useCallback((validation) => {
    setModelValidation(prev => ({
      ...prev,
      ...validation
    }));
  }, []);

  const value = {
    // State
    selectedDataset,
    model,
    training,
    testing,
    modelValidation,

    // Dataset actions
    selectDataset,

    // Model actions
    addLayer,
    updateLayer,
    removeLayer,
    reorderLayers,
    clearModel,
    setLayers,

    // Training actions
    updateTrainingConfig,
    startTraining,
    stopTraining,
    pauseTraining,
    resumeTraining,
    updateTrainingMetrics,
    syncTrainingStatus,
    resetTraining,

    // Testing actions
    setTestInputs,
    setTestOutputs,
    setTestLoading,

    // Validation actions
    updateModelValidation
  };

  return (
    <ModelContext.Provider value={value}>
      {children}
    </ModelContext.Provider>
  );
};
