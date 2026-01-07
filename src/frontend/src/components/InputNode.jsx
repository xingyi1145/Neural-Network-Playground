import { memo } from 'react';
import { Handle, Position } from 'reactflow';

const InputNode = memo(({ data, isConnectable }) => {
  const { inputShape } = data;

  return (
    <div className="px-4 py-3 rounded-xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-600 to-emerald-700 min-w-[180px] shadow-lg">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/20 rounded-lg">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </div>
          <h3 className="font-bold text-sm text-white">Input Layer</h3>
        </div>
        {inputShape ? (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-emerald-200 uppercase">Shape</span>
            <span className="text-sm font-bold text-white bg-black/20 px-2 py-0.5 rounded">
              {Array.isArray(inputShape) ? inputShape.join(' × ') : inputShape}
            </span>
          </div>
        ) : (
          <p className="text-xs text-emerald-200 italic flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Select a dataset
          </p>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-emerald-300 !border-2 !border-white"
      />
    </div>
  );
});

InputNode.displayName = 'InputNode';

export default InputNode;
