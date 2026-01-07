import { useState, useEffect } from 'react';
import { useModel } from '../context/ModelContext';
import TrainingPanel from './TrainingPanel';
import TestingPanel from './TestingPanel';
import { BeakerIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

const RightPanel = () => {
  const { training, selectedDataset } = useModel();
  const [activeView, setActiveView] = useState('training'); // 'training' | 'testing'
  
  // Determine if model has been trained (has metrics)
  const isModelTrained = training.metrics.loss.length > 0 && !training.isTraining;

  // Keep the panel aligned with the current dataset
  useEffect(() => {
    setActiveView('training');
  }, [selectedDataset?.id]);
  
  return (
    <div className="h-full flex flex-col bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      {/* Tab Header */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveView('training')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
            activeView === 'training'
              ? 'bg-gray-700 text-white border-b-2 border-emerald-500'
              : 'text-gray-400 hover:text-white hover:bg-gray-750'
          }`}
        >
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            activeView === 'training' ? 'bg-emerald-500 text-white' : 'bg-gray-600 text-gray-400'
          }`}>3</div>
          <AcademicCapIcon className="w-5 h-5" />
          Train
        </button>
        <button
          onClick={() => setActiveView('testing')}
          disabled={!isModelTrained}
          className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all overflow-hidden ${
            activeView === 'testing'
              ? 'bg-gray-700 text-white border-b-2 border-blue-500'
              : isModelTrained
                ? 'text-gray-400 hover:text-white hover:bg-gray-750 bg-gradient-to-r from-emerald-600/10 to-blue-600/10'
                : 'text-gray-600 cursor-not-allowed'
          }`}
        >
          {isModelTrained && activeView !== 'testing' && (
            <>
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent animate-shimmer"></span>
              <span className="absolute inset-0 border border-emerald-500/30 rounded"></span>
            </>
          )}
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold relative z-10 ${
            activeView === 'testing' ? 'bg-blue-500 text-white' : 
            isModelTrained ? 'bg-emerald-500/80 text-white' : 'bg-gray-700 text-gray-500'
          }`}>4</div>
          <BeakerIcon className="w-5 h-5 relative z-10" />
          <span className="relative z-10">Test</span>
          {!isModelTrained && (
            <svg className="w-4 h-4 text-gray-500 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )}
        </button>
      </div>
      
      {/* Panel Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeView === 'training' ? (
          <TrainingPanel />
        ) : (
          <TestingPanel />
        )}
      </div>
    </div>
  );
};

export default RightPanel;



