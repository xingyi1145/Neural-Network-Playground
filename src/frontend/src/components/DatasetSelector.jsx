// DatasetSelector - displays available datasets for selection
import { useState, useEffect, useMemo } from 'react';
import { useModel } from '../context/ModelContext';
import { fetchDatasets } from '../services/modelApi';
import Tooltip from './Tooltip';

const DatasetSelector = () => {
  const { selectedDataset, selectDataset } = useModel();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDatasets();
      setDatasets(data);
    } catch (err) {
      setError('Failed to load datasets');
      console.error('Error loading datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDataset = (dataset) => {
    selectDataset(dataset);
  };

  const datasetScales = useMemo(() => {
    const toPositiveNumber = (value) => {
      const num = Number(value);
      return Number.isFinite(num) && num > 0 ? num : null;
    };

    const samples = datasets.map((d) => toPositiveNumber(d.num_samples)).filter(Boolean);
    const features = datasets.map((d) => toPositiveNumber(d.num_features)).filter(Boolean);
    const classes = datasets.map((d) => toPositiveNumber(d.num_classes)).filter(Boolean);

    const logMax = (arr) => {
      if (!arr.length) return 0;
      const maxVal = Math.max(...arr);
      return maxVal > 0 ? Math.log10(maxVal) : 0;
    };

    return {
      samplesLogMax: logMax(samples),
      featuresLogMax: logMax(features),
      classesLogMax: logMax(classes),
    };
  }, [datasets]);

  const getBarWidth = (value, logMax) => {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return 0;
    const logVal = Math.log10(num);
    const safeMax = logMax > 0 ? logMax : logVal || 1;
    const percent = (logVal / safeMax) * 100;
    return Math.max(6, Math.min(100, percent));
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="px-2 py-1.5 border-b border-gray-700 bg-gradient-to-r from-gray-750 to-gray-800 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-semibold text-white truncate">Step 1: Dataset</h2>
              <p className="text-[9px] text-gray-400 truncate">Choose your training data</p>
            </div>
          </div>
          <Tooltip text="Pick a dataset first. It sets the input shape and number of outputs your network must learn." position="left">
            <span className="w-4 h-4 rounded-full border border-blue-500/50 text-blue-200 flex items-center justify-center text-[9px] bg-blue-900/30 hover:bg-blue-800/50 transition-colors cursor-help flex-shrink-0">
              ?
            </span>
          </Tooltip>
        </div>
      </div>

      {/* Dataset List */}
      <div className="flex-1 min-h-0 p-1.5">
        <div className="h-full flex flex-col">
          {loading && (
            <div className="flex-1 flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
            </div>
          )}

          {error && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-4 px-2">
              <p className="text-red-400 text-xs">{error}</p>
              <button
                onClick={loadDatasets}
                className="mt-2 text-blue-400 hover:text-blue-300 text-xs underline"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && datasets.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-center py-4 px-2">
              <p className="text-gray-400 text-xs">No datasets available</p>
            </div>
          )}

          {!loading && !error && datasets.length > 0 && (
            <div className="flex-1 min-h-0 overflow-hidden">
              <div className="grid grid-cols-1 gap-1 auto-rows-[minmax(90px,1fr)] h-full overflow-y-auto pr-1">
                {datasets.map((dataset) => {
                  const isSelected = selectedDataset?.id === dataset.id;
                  const taskColor = dataset.task_type === 'classification' 
                    ? 'text-purple-400 bg-purple-900/30' 
                    : 'text-amber-400 bg-amber-900/30';
                  const samplesWidth = getBarWidth(dataset.num_samples, datasetScales.samplesLogMax);
                  const featuresWidth = getBarWidth(dataset.num_features, datasetScales.featuresLogMax);
                  const classesWidth = getBarWidth(dataset.num_classes, datasetScales.classesLogMax);
                  
                  return (
                    <button
                      key={dataset.id}
                      onClick={() => handleSelectDataset(dataset)}
                      className={`w-full h-full p-2 rounded border transition-all text-left group ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-600/10 shadow shadow-emerald-500/10'
                          : 'border-gray-600 hover:border-blue-500/50 hover:bg-gray-700/80 bg-gray-700/50'
                      }`}
                    >
                      <div className="flex flex-col h-full">
                        {/* Dataset Info Header */}
                        <div className="flex items-center gap-1.5 mb-1">
                          <h3 className={`font-medium text-sm flex-1 ${
                            isSelected ? 'text-emerald-300' : 'text-white'
                          }`}>
                            {dataset.name}
                          </h3>
                          {dataset.task_type && (
                            <span className={`text-[7px] px-1 py-0.5 rounded font-medium flex-shrink-0 ${taskColor}`}>
                              {dataset.task_type === 'classification' ? 'Classification' : 'Regression'}
                            </span>
                          )}
                        </div>

                        {/* Metric Bars (centered in remaining space) */}
                        <div className="flex-1 flex items-center">
                          <div className="space-y-1.5 w-full">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400 w-14 flex-shrink-0">Samples</span>
                              <div className="flex-1 h-1.5 bg-gray-700/80 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-blue-400/80 to-blue-500" style={{ width: `${samplesWidth}%` }}></div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400 w-14 flex-shrink-0">Features</span>
                              <div className="flex-1 h-1.5 bg-gray-700/80 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-teal-400/80 to-emerald-500" style={{ width: `${featuresWidth}%` }}></div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400 w-14 flex-shrink-0">Classes</span>
                              <div className="flex-1 h-1.5 bg-gray-700/80 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-amber-400/80 to-orange-500" style={{ width: `${classesWidth}%` }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatasetSelector;
