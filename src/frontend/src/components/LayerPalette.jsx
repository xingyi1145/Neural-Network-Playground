import React from 'react';

const LAYER_TYPES = [
  { type: 'Linear', label: 'Linear Layer' },
  { type: 'ReLU', label: 'ReLU Activation' },
  { type: 'Conv2d', label: 'Conv2d Layer' },
  { type: 'MaxPool2d', label: 'MaxPool2d' },
  { type: 'Flatten', label: 'Flatten' },
  { type: 'Dropout', label: 'Dropout' },
];

const LayerPalette = () => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside style={{ 
      width: '200px', 
      padding: '15px', 
      borderRight: '1px solid #444', 
      backgroundColor: '#222',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#eee' }}>Layer Palette</div>
      <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '10px' }}>Drag layers to the canvas</div>
      
      {LAYER_TYPES.map((layer) => (
        <div
          key={layer.type}
          onDragStart={(event) => onDragStart(event, layer.type)}
          draggable
          style={{
            padding: '10px',
            border: '1px solid #555',
            borderRadius: '4px',
            cursor: 'grab',
            backgroundColor: '#333',
            color: '#fff',
            textAlign: 'center'
          }}
        >
          {layer.label}
        </div>
      ))}
    </aside>
  );
};

export default LayerPalette;
