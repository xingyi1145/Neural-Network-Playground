import { useState, useCallback, useEffect, useRef } from 'react';
import { useModel } from '../context/ModelContext';
import { testModel } from '../services/modelApi';
import Tooltip from './Tooltip';
import {
  MNISTCanvas,
  IrisInput,
  CaliforniaHousingInput,
  SyntheticInput,
  WineQualityInput,
  DefaultInput,
} from './testing';

const DATASET_INPUTS = {
  mnist: MNISTCanvas,
  iris: IrisInput,
  california_housing: CaliforniaHousingInput,
  synthetic: SyntheticInput,
  wine_quality: WineQualityInput,
};

const CLASS_LABELS = {
  mnist: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  iris: ['Setosa', 'Versicolor', 'Virginica'],
  synthetic: ['Same Sign (Class 0)', 'Opposite Signs (Class 1)'],
  wine_quality: ['3', '4', '5', '6', '7', '8', '9'],
};

const TestingPanel = () => {
  const { selectedDataset, training, testing, setTestInputs, setTestOutputs, setTestLoading } = useModel();
  const [currentInput, setCurrentInput] = useState(null);
  const [error, setError] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const debounceTimerRef = useRef(null);
  const lastPredictionRef = useRef(null);
  const setTestInputsRef = useRef(setTestInputs);
  
  // Keep refs up to date
  useEffect(() => {
    setTestInputsRef.current = setTestInputs;
  }, [setTestInputs]);

  const sessionId = training.trainingId;
  const datasetMismatch = Boolean(
    selectedDataset &&
    training.datasetId &&
    training.datasetId !== selectedDataset.id
  );

  // Clear predictions when changing datasets to avoid cross-dataset artifacts
  useEffect(() => {
    setCurrentInput(null);
    setPrediction(null);
    setError(null);
    lastPredictionRef.current = null;
    setTestOutputs(null);
  }, [selectedDataset?.id, setTestOutputs]);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (datasetMismatch) {
      setTestLoading(false);
      setPrediction(null);
      setError(null);
      return;
    }

    if (!sessionId || !currentInput || (Array.isArray(currentInput) && currentInput.length === 0)) {
      return;
    }

    const inputKey = JSON.stringify(currentInput);
    if (lastPredictionRef.current === inputKey) {
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setError(null);
        setTestLoading(true);
        lastPredictionRef.current = inputKey;

        const result = await testModel(sessionId, currentInput);
        setPrediction(result);
        setTestOutputs(result);
      } catch (err) {
        setError(err.response?.data?.detail || err.message || 'Failed to test model');
        console.error('Prediction error:', err);
      } finally {
        setTestLoading(false);
      }
    }, 150);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [currentInput, sessionId, setTestLoading, setTestOutputs, datasetMismatch]);

  const handleInputChange = useCallback((inputs) => {
    setError(null);
    setCurrentInput(inputs);
    setTestInputsRef.current(inputs);
  }, []);

  const InputComponent = selectedDataset 
    ? DATASET_INPUTS[selectedDataset.id] || DefaultInput
    : DefaultInput;

  const classLabels = selectedDataset ? CLASS_LABELS[selectedDataset.id] : null;

  const hasPrediction = Boolean(prediction);
  const hasProbabilities = hasPrediction && prediction.probabilities && classLabels;
  const hasActiveSession = Boolean(sessionId) && !datasetMismatch;
  const shouldShowError = error && !datasetMismatch;
  const idleHint = hasActiveSession
    ? 'Interact with the inputs to see predictions without layout shifts.'
    : 'Train a model on this dataset, then tweak the sliders to see quality predictions.';

  const formatPrediction = () => {
    if (!hasPrediction) return null;
    if (selectedDataset?.task_type === 'classification') {
      return classLabels?.[prediction.prediction] || `Class ${prediction.prediction}`;
    }

    // Regression
    if (selectedDataset?.id === 'california_housing') {
      const raw = prediction.prediction;
      const dollars = raw * 100000;
      const prettyDollars = Number.isFinite(dollars)
        ? `$${dollars.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
        : raw;
      const rawText = Number.isFinite(raw) ? raw.toFixed(3) : raw;
      return (
        <>
          {prettyDollars}
          <span className="block text-[10px] text-gray-400 font-normal">
            {rawText} (model output is in $100k units)
          </span>
        </>
      );
    }

    return prediction.prediction?.toFixed?.(4) || prediction.prediction;
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-3 sm:px-4 py-1.5 border-b border-gray-700 bg-gray-750 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-white">Test Your Model</h2>
          <Tooltip text="Feed custom inputs to see predictions in real time. Try varying one feature at a time to build intuition." position="bottom">
            <span className="w-5 h-5 rounded-full border border-blue-500/50 text-blue-200 flex items-center justify-center text-[10px] bg-blue-900/30">
              ?
            </span>
          </Tooltip>
        </div>
        {selectedDataset && (
          <span className="text-[10px] text-blue-400 px-2 py-0.5 bg-blue-900/30 rounded">
            {selectedDataset.name}
          </span>
        )}
      </div>

      {/* Scrollable Input Controls Area */}
      <div className="flex-1 min-h-0 p-2 sm:p-3 overflow-y-auto">
        {datasetMismatch && (
          <div className="p-3 mb-2 rounded-lg border border-red-600/50 bg-red-900/20 text-xs text-red-100">
            <p className="font-semibold text-red-100">Train on this dataset before testing</p>
            <p className="text-red-200">
              Your last session was trained on a different dataset. Retrain on <span className="font-semibold">{selectedDataset?.name || 'this dataset'}</span> to sync scalers and labels.
            </p>
          </div>
        )}

        {!datasetMismatch && !hasActiveSession && (
          <div className="p-3 mb-2 rounded-lg border border-amber-500/50 bg-amber-900/20 text-xs text-amber-100">
            <p className="font-semibold text-amber-100">Train to unlock live predictions</p>
            <p className="text-amber-200">Kick off training, then tweak the sliders to watch the quality score update instantly.</p>
          </div>
        )}

        {/* Input Controls */}
        <InputComponent
          onInputChange={handleInputChange}
          numFeatures={selectedDataset?.num_features || 1}
          prediction={prediction}
        />
      </div>

      {/* Fixed Prediction Result at Bottom */}
      <div className="flex-shrink-0 p-2 sm:p-3 border-t border-gray-700 bg-gray-800">
        <div className="p-2 bg-gray-750 rounded-lg border border-gray-600">
          {shouldShowError && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          {datasetMismatch ? (
            <p className="text-xs text-red-200">Testing is paused until you train on the current dataset.</p>
          ) : hasPrediction ? (
            <div className="flex items-center gap-4 flex-wrap">
              {/* Main prediction */}
              <div className="flex flex-col min-w-[200px]">
                <p className="text-[10px] text-gray-400 uppercase">Prediction</p>
                <p className="text-lg font-bold text-white leading-tight break-words max-w-[320px] min-h-[44px]">
                  {formatPrediction()}
                </p>
              </div>

              {/* Confidence - only show for classification datasets (not california_housing or regression) */}
              {prediction.confidence !== undefined && selectedDataset?.id !== 'california_housing' && (
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-gray-400">Confidence</span>
                    <span className="text-emerald-400 font-medium">{(prediction.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${prediction.confidence * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            !shouldShowError && (
              <p className="text-xs text-gray-500">{idleHint}</p>
            )
          )}

          {/* Probabilities */}
          {hasProbabilities && (
            <div className="mt-3 pt-3 border-t border-gray-600">
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${prediction.probabilities.length}, minmax(0, 1fr))` }}
              >
                {prediction.probabilities.map((prob, idx) => (
                  <div key={idx} className="text-center min-w-0">
                    <div className="h-1 bg-gray-700 rounded-full overflow-hidden mb-1">
                      <div
                        className={`h-full rounded-full ${idx === prediction.prediction ? 'bg-emerald-500' : 'bg-gray-500'}`}
                        style={{ width: `${prob * 100}%` }}
                      />
                    </div>
                    <span
                      className={`block text-[10px] leading-tight whitespace-normal break-words min-h-[28px] ${idx === prediction.prediction ? 'text-emerald-400 font-medium' : 'text-gray-400'}`}
                    >
                      {classLabels[idx]} {(prob * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestingPanel;
