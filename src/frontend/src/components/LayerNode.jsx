import { memo } from 'react';
import { Handle, Position } from 'reactflow';

const LayerNode = memo(({ data, isConnectable }) => {
  const { layer, onEdit, onDelete } = data;

  const getLayerColor = (type) => {
    const colors = {
      dense: 'from-blue-600 to-blue-700 border-blue-400',
      conv2d: 'from-purple-600 to-purple-700 border-purple-400',
      maxpooling2d: 'from-green-600 to-green-700 border-green-400',
      dropout: 'from-yellow-600 to-yellow-700 border-yellow-400',
      flatten: 'from-orange-600 to-orange-700 border-orange-400',
      input: 'from-gray-600 to-gray-700 border-gray-400',
      output: 'from-pink-600 to-pink-700 border-pink-400'
    };
    return colors[type?.toLowerCase()] || 'from-gray-600 to-gray-700 border-gray-400';
  };

  const getLayerIcon = (type) => {
    const icons = {
      dense: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      ),
      dropout: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
      conv2d: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
    };
    return icons[type?.toLowerCase()] || icons.dense;
  };

  const getActivationBadge = (activation) => {
    if (!activation || activation === 'linear') return null;
    const activationColors = {
      relu: 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50',
      sigmoid: 'bg-amber-500/30 text-amber-300 border-amber-500/50',
      tanh: 'bg-cyan-500/30 text-cyan-300 border-cyan-500/50',
      softmax: 'bg-pink-500/30 text-pink-300 border-pink-500/50',
    };
    const colorClass = activationColors[activation] || 'bg-gray-500/30 text-gray-300 border-gray-500/50';
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${colorClass}`}>
        {activation}
      </span>
    );
  };

  return (
    <div className={`px-4 py-3 rounded-xl border-2 min-w-[180px] bg-gradient-to-br shadow-lg ${getLayerColor(layer.type)}`}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-white !border-2 !border-gray-400"
      />

      {/* Layer Content */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-white/20 rounded">
                {getLayerIcon(layer.type)}
              </div>
              <h3 className="font-bold text-sm text-white capitalize">
                {layer.type}
              </h3>
            </div>
            <div className="mt-2 space-y-1">
              {layer.units && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-300 uppercase">Neurons</span>
                  <span className="text-sm font-bold text-white bg-black/20 px-2 py-0.5 rounded">
                    {layer.units}
                  </span>
                </div>
              )}
              {layer.filters && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-300 uppercase">Filters</span>
                  <span className="text-sm font-bold text-white bg-black/20 px-2 py-0.5 rounded">
                    {layer.filters}
                  </span>
                </div>
              )}
              {layer.rate && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-300 uppercase">Rate</span>
                  <span className="text-sm font-bold text-white bg-black/20 px-2 py-0.5 rounded">
                    {layer.rate}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {onEdit && onDelete && (
            <div className="flex flex-col gap-1">
              <button
                onClick={() => onEdit(layer)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors bg-white/10"
                title="Edit layer"
              >
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(layer.id)}
                className="p-1.5 hover:bg-red-500/50 rounded-lg transition-colors bg-red-500/20"
                title="Delete layer"
              >
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Activation Badge */}
        {layer.activation && getActivationBadge(layer.activation)}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-emerald-400 !border-2 !border-emerald-300"
      />
    </div>
  );
});

LayerNode.displayName = 'LayerNode';

export default LayerNode;
