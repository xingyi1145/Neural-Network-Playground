import { memo } from 'react';
import { Handle, Position } from 'reactflow';

const OutputNode = memo(({ data, isConnectable }) => {
  const { outputShape, outputClasses } = data;

  return (
    <div className="px-4 py-3 rounded-xl border-2 border-rose-400 bg-gradient-to-br from-rose-600 to-rose-700 min-w-[180px] shadow-lg">
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-white !border-2 !border-rose-300"
      />

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/20 rounded-lg">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <h3 className="font-bold text-sm text-white">Output Layer</h3>
        </div>
        
        {outputShape || outputClasses ? (
          <div className="space-y-1">
            {outputClasses && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-rose-200 uppercase">Classes</span>
                <span className="text-sm font-bold text-white bg-black/20 px-2 py-0.5 rounded">
                  {outputClasses}
                </span>
              </div>
            )}
            {outputShape && !outputClasses && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-rose-200 uppercase">Shape</span>
                <span className="text-sm font-bold text-white bg-black/20 px-2 py-0.5 rounded">
                  {Array.isArray(outputShape) ? outputShape.join(' × ') : outputShape}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-rose-200 italic flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Add layers
          </p>
        )}
      </div>
    </div>
  );
});

OutputNode.displayName = 'OutputNode';

export default OutputNode;
