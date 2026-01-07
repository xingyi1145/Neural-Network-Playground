import { useState, useEffect, useRef } from 'react';
import { useModel } from '../context/ModelContext';
import { startTraining, getTrainingStatus, stopTraining as stopTrainingApi, pauseTraining as pauseTrainingApi, resumeTraining as resumeTrainingApi } from '../services/modelApi';
import LossGraph from './LossGraph';
import Tooltip from './Tooltip';

const TrainingPanel = () => {
  const {
    model,
    selectedDataset,
    training,
    modelValidation,
    updateTrainingConfig,
    startTraining: startTrainingContext,
    stopTraining: stopTrainingContext,
    pauseTraining: pauseTrainingContext,
    resumeTraining: resumeTrainingContext,
    updateTrainingMetrics,
    syncTrainingStatus,
    resetTraining,
  } = useModel();

  const [error, setError] = useState(null);
  const [showAccuracy, setShowAccuracy] = useState(true);
  const pollingIntervalRef = useRef(null);
  const hasDenseLayers = model.layers.some(layer => layer.type === 'dense');
  const startDisabledReason = (() => {
    if (!selectedDataset) return 'Pick a dataset before training can begin.';
    if (model.layers.length === 0) return 'Add at least one layer to define your model.';
    if (!hasDenseLayers) return 'Add at least one Dense layer (other layer types are not yet trainable).';
    if (!modelValidation.hasValidConnections) return modelValidation.connectionError || 'Invalid model connections.';
    return '';
  })();

  // Poll training status
  useEffect(() => {
    if (training.isTraining && training.trainingId) {
      console.log('Starting polling for session:', training.trainingId);
      
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const status = await getTrainingStatus(training.trainingId);
          console.log('Training status:', status);

          syncTrainingStatus({
            status: status.status,
            current_epoch: status.current_epoch,
            total_epochs: status.total_epochs,
          });

          // Update metrics if we have new ones
          if (status.metrics && status.metrics.length > 0) {
            updateTrainingMetrics(status.metrics);
          }

          if (status.status === 'paused') {
            pauseTrainingContext();
          }

          if (status.status === 'completed' || status.status === 'failed' || status.status === 'stopped') {
            stopTrainingContext(status.status);
            clearInterval(pollingIntervalRef.current);

            if (status.status === 'failed') {
              setError(status.error_message || 'Training failed');
            } else {
              setError(null);
            }
          } else if (status.status === 'running') {
            resumeTrainingContext();
          }
        } catch (err) {
          console.error('Error polling training status:', err);
        }
      }, 1500); // Poll every 1.5 seconds (matches backend poll_interval_seconds)

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [training.isTraining, training.trainingId, stopTrainingContext, updateTrainingMetrics]);

  const handleStartTraining = async () => {
    if (startDisabledReason) return;

    try {
      setError(null);

      // Build backend-compatible layer list
      const inputLayer = {
        type: 'input',
        neurons: model.inputShape || selectedDataset.input_shape,
      };

      // Backend only supports dense layers - filter out all others (dropout, conv2d, maxpooling2d, flatten)
      const hiddenLayers = model.layers
        .filter(layer => layer.type === 'dense')
        .map(layer => ({
          type: 'hidden', // Backend expects 'hidden' for all hidden layers
          neurons: parseInt(layer.units),
          activation: layer.activation,
        }));

      const outputLayer = {
        type: 'output',
        neurons: selectedDataset.output_shape || 1, // Use output_shape from backend
        activation: selectedDataset.task_type === 'classification' ? 'softmax' : 'linear',
      };

      const fullLayers = [inputLayer, ...hiddenLayers, outputLayer];

      const datasetHp = selectedDataset?.hyperparameters || {};
      const payload = {
        layers: fullLayers,
        dataset_id: selectedDataset.id,
      };

      const maybeIncludeOverride = (key, value, datasetDefault) => {
        if (value === undefined || value === null || Number.isNaN(value)) return;
        if (datasetDefault === undefined || datasetDefault === null) {
          payload[key] = value;
          return;
        }
        if (value !== datasetDefault) {
          payload[key] = value;
        }
      };

      maybeIncludeOverride('epochs', training.config.epochs, datasetHp.epochs);
      maybeIncludeOverride('learning_rate', training.config.learningRate, datasetHp.learning_rate);
      maybeIncludeOverride('batch_size', training.config.batchSize, datasetHp.batch_size);
      maybeIncludeOverride('optimizer', training.config.optimizer, datasetHp.optimizer);

      console.log('Starting training with payload:', payload);

      // Start training
      const response = await startTraining(model.id || 'new', payload);
      console.log('Training started, response:', response);

      // Backend returns session_id, not training_id
      startTrainingContext(response.session_id, response.total_epochs);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start training');
      console.error('Training error:', err);
    }
  };

  const handleStopTraining = async () => {
    if (training.trainingId) {
      try {
        await stopTrainingApi(training.trainingId);
        stopTrainingContext('stopped');
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      } catch (err) {
        console.error('Error stopping training:', err);
      }
    }
  };

  const handlePauseTraining = async () => {
    if (training.trainingId) {
      try {
        await pauseTrainingApi(training.trainingId);
        pauseTrainingContext();
      } catch (err) {
        console.error('Error pausing training:', err);
      }
    }
  };

  const handleResumeTraining = async () => {
    if (training.trainingId) {
      try {
        await resumeTrainingApi(training.trainingId);
        resumeTrainingContext();
      } catch (err) {
        console.error('Error resuming training:', err);
      }
    }
  };

  const handleReset = () => {
    resetTraining();
    setError(null);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Fixed Top Section - Configuration & Controls */}
      <div className="flex-shrink-0 p-3 space-y-3 overflow-y-auto">
        {/* Quick Stats Banner */}
        {selectedDataset && (
          <div className="flex items-center gap-2 p-2 bg-gray-750 rounded-lg border border-gray-600">
            <div className="flex-1 text-center border-r border-gray-600">
              <p className="text-[10px] text-gray-500 uppercase">Dataset</p>
              <p className="text-xs font-medium text-white truncate">{selectedDataset.name}</p>
            </div>
            <div className="flex-1 text-center border-r border-gray-600">
              <p className="text-[10px] text-gray-500 uppercase">Samples</p>
              <p className="text-xs font-medium text-blue-400">{selectedDataset.num_samples?.toLocaleString()}</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-[10px] text-gray-500 uppercase">Layers</p>
              <p className="text-xs font-medium text-purple-400">{model.layers.length}</p>
            </div>
          </div>
        )}

        {/* Training Configuration */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Hyperparameters</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="flex items-center gap-1 text-[10px] font-medium text-gray-400 mb-1">
                <span>Epochs</span>
                <Tooltip text="How many complete passes over the dataset. More runs can improve learning but may overfit." position="top">
                  <span className="w-4 h-4 rounded-full border border-blue-500/50 text-blue-200 flex items-center justify-center text-[10px] bg-blue-900/30">
                    ?
                  </span>
                </Tooltip>
              </label>
              <input
                type="number"
                value={training.config.epochs}
                onChange={(e) => updateTrainingConfig({ epochs: parseInt(e.target.value) })}
                disabled={training.isTraining}
                className="w-full px-3 py-2 text-sm border border-gray-600 bg-gray-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                min="1"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-[10px] font-medium text-gray-400 mb-1">
                <span>Learning Rate</span>
                <Tooltip text="Step size for every weight update. Try smaller values if training looks unstable." position="top">
                  <span className="w-4 h-4 rounded-full border border-blue-500/50 text-blue-200 flex items-center justify-center text-[10px] bg-blue-900/30">
                    ?
                  </span>
                </Tooltip>
              </label>
              <input
                type="number"
                value={training.config.learningRate}
                onChange={(e) => updateTrainingConfig({ learningRate: parseFloat(e.target.value) })}
                disabled={training.isTraining}
                className="w-full px-3 py-2 text-sm border border-gray-600 bg-gray-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                step="0.001"
                min="0.0001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="flex items-center gap-1 text-[10px] font-medium text-gray-400 mb-1">
                <span>Batch Size</span>
                <Tooltip text="Number of samples seen before a gradient update. Bigger batches train faster but may generalize differently." position="top">
                  <span className="w-4 h-4 rounded-full border border-blue-500/50 text-blue-200 flex items-center justify-center text-[10px] bg-blue-900/30">
                    ?
                  </span>
                </Tooltip>
              </label>
              <input
                type="number"
                value={training.config.batchSize}
                onChange={(e) => updateTrainingConfig({ batchSize: parseInt(e.target.value) })}
                disabled={training.isTraining}
                className="w-full px-3 py-2 text-sm border border-gray-600 bg-gray-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                min="1"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-[10px] font-medium text-gray-400 mb-1">
                <span>Optimizer</span>
                <Tooltip text="Algorithm that adjusts weights. Adam is a solid default; try SGD for simpler, slower updates." position="top">
                  <span className="w-4 h-4 rounded-full border border-blue-500/50 text-blue-200 flex items-center justify-center text-[10px] bg-blue-900/30">
                    ?
                  </span>
                </Tooltip>
              </label>
              <select
                value={training.config.optimizer}
                onChange={(e) => updateTrainingConfig({ optimizer: e.target.value })}
                disabled={training.isTraining}
                className="w-full px-3 py-2 text-sm border border-gray-600 bg-gray-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
              >
                <option value="adam">Adam</option>
                <option value="sgd">SGD</option>
                <option value="rmsprop">RMSprop</option>
                <option value="adagrad">Adagrad</option>
              </select>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!training.isTraining ? (
            <>
              {startDisabledReason ? (
                <Tooltip text={startDisabledReason} position="top" className="max-w-sm">
                  <button
                    onClick={handleStartTraining}
                    disabled
                    className="flex-1 px-3 py-2 bg-gray-700 text-white text-sm font-semibold rounded cursor-not-allowed opacity-90"
                  >
                    Start Training
                  </button>
                </Tooltip>
              ) : (
                <button
                  onClick={handleStartTraining}
                  disabled={training.isTraining}
                  className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Start Training
                </button>
              )}
              {training.metrics.loss.length > 0 && (
                <button
                  onClick={handleReset}
                  className="px-3 py-2 border border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 text-sm font-medium rounded transition-colors"
                >
                  Reset
                </button>
              )}
            </>
          ) : training.status === 'paused' ? (
            <>
              <button
                onClick={handleResumeTraining}
                className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded transition-colors shadow-sm"
              >
                Resume
              </button>
              <button
                onClick={handleStopTraining}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded transition-colors shadow-sm"
              >
                Stop
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handlePauseTraining}
                className="flex-1 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded transition-colors shadow-sm"
              >
                Pause
              </button>
              <button
                onClick={handleStopTraining}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded transition-colors shadow-sm"
              >
                Stop
              </button>
            </>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-2.5 bg-red-900/40 border border-red-700/50 rounded">
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        {/* Validation Warnings */}
        {modelValidation.warnings && modelValidation.warnings.length > 0 && !training.isTraining && (
          <div className="p-2.5 bg-amber-900/30 border border-amber-700/50 rounded">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="text-xs font-medium text-amber-300 mb-1">Warning</p>
                {modelValidation.warnings.map((warning, idx) => (
                  <p key={idx} className="text-xs text-amber-200/80">{warning}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Training Status */}
        {training.isTraining && (
          <div className="p-2.5 bg-blue-900/30 border border-blue-700/50 rounded">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-300 font-medium">
                {training.status === 'paused' ? 'Training paused' : 'Training in progress'}
              </span>
              <span className="text-xs text-blue-400 font-mono">
                {training.currentEpoch} / {training.totalEpochs || training.config.epochs}
              </span>
            </div>
            {training.metrics.loss.length > 0 && (
              <div className="mt-1.5 text-[10px] text-blue-400 font-mono">
                Loss: {training.metrics.loss[training.metrics.loss.length - 1]?.value.toFixed(4)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Flexible Graph Section - Takes remaining space */}
      {training.metrics.loss.length > 0 && (
        <div className="flex-1 flex flex-col p-3 pt-0 min-h-0">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
              Training Progress
            </label>
            <label className="flex items-center gap-1.5 text-[10px] text-gray-400 cursor-pointer hover:text-gray-300 transition-colors">
              <input
                type="checkbox"
                checked={showAccuracy}
                onChange={(e) => setShowAccuracy(e.target.checked)}
                className="rounded w-3 h-3"
              />
              <span>Show Accuracy</span>
              <Tooltip text="Overlay accuracy when available. Useful for classification datasets." position="left">
                <span className="w-4 h-4 rounded-full border border-blue-500/50 text-blue-200 flex items-center justify-center text-[10px] bg-blue-900/30">
                  ?
                </span>
              </Tooltip>
            </label>
          </div>
          <div className="flex-1 border border-gray-600 rounded p-2 bg-gray-900 min-h-0">
            <LossGraph data={training.metrics} showAccuracy={showAccuracy} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingPanel;
