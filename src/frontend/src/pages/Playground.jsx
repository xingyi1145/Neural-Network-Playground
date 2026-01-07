import { ModelProvider, useModel } from '../context/ModelContext';
import DatasetSelector from '../components/DatasetSelector';
import ModelCanvas from '../components/ModelCanvas';
import RightPanel from '../components/RightPanel';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const WorkflowSteps = () => {
  const { selectedDataset, model, training } = useModel();
  
  const steps = [
    { id: 1, name: 'Select Dataset', done: !!selectedDataset, active: !selectedDataset },
    { id: 2, name: 'Build Model', done: model.layers.length > 0, active: selectedDataset && model.layers.length === 0 },
    { id: 3, name: 'Train', done: training.metrics.loss.length > 0 && !training.isTraining, active: model.layers.length > 0 && training.metrics.loss.length === 0 },
    { id: 4, name: 'Test', done: false, active: training.metrics.loss.length > 0 && !training.isTraining },
  ];

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, idx) => (
        <div key={step.id} className="flex items-center">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            step.done ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' :
            step.active ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50 animate-pulse' :
            'bg-gray-700/50 text-gray-500 border border-gray-600/30'
          }`}>
            {step.done ? (
              <CheckCircleIcon className="w-4 h-4" />
            ) : (
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step.active ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-400'
              }`}>{step.id}</span>
            )}
            <span>{step.name}</span>
          </div>
          {idx < steps.length - 1 && (
            <svg className="w-4 h-4 mx-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
};

const PlaygroundContent = () => {
  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/logo.png"
              alt="Nurel logo"
              className="h-10 w-10 object-contain drop-shadow-lg"
            />
            <div>
              <h1 className="text-xl font-bold text-white brand-font">nurel</h1>
              <p className="text-xs text-gray-400">Neural network playground</p>
            </div>
          </div>
          <WorkflowSteps />
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-4 overflow-hidden">
        {/* Left Panel - Dataset Selector */}
        <div className="col-span-12 lg:col-span-3 xl:col-span-2 h-full bg-gray-800 rounded-lg shadow-md border border-gray-700 overflow-hidden min-w-0">
          <DatasetSelector />
        </div>

        {/* Center Panel - Model Canvas */}
        <div className="col-span-12 lg:col-span-6 xl:col-span-6 h-full bg-gray-800 rounded-lg shadow-md border border-gray-700 overflow-hidden">
          <ModelCanvas />
        </div>

        {/* Right Panel - Training & Testing (unified) */}
        <div className="col-span-12 lg:col-span-3 xl:col-span-4 h-full overflow-hidden">
          <RightPanel />
        </div>
      </div>
    </div>
  );
};

const Playground = () => {
  return (
    <ModelProvider>
      <PlaygroundContent />
    </ModelProvider>
  );
};

export default Playground;
