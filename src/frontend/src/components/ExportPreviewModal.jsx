const ExportPreviewModal = ({
  isOpen,
  code,
  onClose,
  onDownload,
  datasetName,
  inputFeatures,
  outputFeatures,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between gap-3 p-4 border-b border-gray-800">
          <div>
            <h3 className="text-lg font-semibold text-white">Preview model.py</h3>
            <p className="text-xs text-gray-400">
              {datasetName ? `Generated from ${datasetName}` : 'Generated from current canvas'}
            </p>
            <p className="text-[10px] text-gray-500 mt-1">
              Input dim: {inputFeatures} | Output dim: {outputFeatures}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close preview"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6l8 8M6 14L14 6" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-hidden px-4">
          <div className="bg-gray-950 border border-gray-800 rounded-lg mt-3 mb-4 h-full overflow-auto">
            <pre className="p-4 text-xs text-gray-200 font-mono whitespace-pre">
              {code}
            </pre>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white border border-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onDownload}
            className="px-3 py-2 text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Download model.py
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportPreviewModal;
