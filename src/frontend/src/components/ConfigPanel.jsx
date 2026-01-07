import React, { useState, useEffect } from 'react';

const ConfigPanel = ({ selectedNode, onChange }) => {
  const [config, setConfig] = useState({});

  useEffect(() => {
    if (selectedNode) {
      setConfig(selectedNode.data.config || {});
    } else {
      setConfig({});
    }
  }, [selectedNode]);

  const handleChange = (key, value) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onChange(selectedNode.id, newConfig);
  };

  if (!selectedNode) {
    return (
      <aside style={{ 
        width: '250px', 
        padding: '15px', 
        borderLeft: '1px solid #444', 
        backgroundColor: '#222',
        color: '#aaa'
      }}>
        Select a layer to configure
      </aside>
    );
  }

  const renderFields = () => {
    const type = selectedNode.data.type;
    
    switch (type) {
      case 'Linear':
        return (
          <>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>In Features</label>
              <input 
                type="number" 
                value={config.in_features || ''} 
                onChange={(e) => handleChange('in_features', parseInt(e.target.value))}
                style={{ width: '100%', padding: '5px', backgroundColor: '#444', border: 'none', color: 'white' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Out Features</label>
              <input 
                type="number" 
                value={config.out_features || ''} 
                onChange={(e) => handleChange('out_features', parseInt(e.target.value))}
                style={{ width: '100%', padding: '5px', backgroundColor: '#444', border: 'none', color: 'white' }}
              />
            </div>
          </>
        );
      case 'Conv2d':
        return (
          <>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>In Channels</label>
              <input 
                type="number" 
                value={config.in_channels || ''} 
                onChange={(e) => handleChange('in_channels', parseInt(e.target.value))}
                style={{ width: '100%', padding: '5px', backgroundColor: '#444', border: 'none', color: 'white' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Out Channels</label>
              <input 
                type="number" 
                value={config.out_channels || ''} 
                onChange={(e) => handleChange('out_channels', parseInt(e.target.value))}
                style={{ width: '100%', padding: '5px', backgroundColor: '#444', border: 'none', color: 'white' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Kernel Size</label>
              <input 
                type="number" 
                value={config.kernel_size || ''} 
                onChange={(e) => handleChange('kernel_size', parseInt(e.target.value))}
                style={{ width: '100%', padding: '5px', backgroundColor: '#444', border: 'none', color: 'white' }}
              />
            </div>
          </>
        );
      case 'Dropout':
        return (
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Probability</label>
            <input 
              type="number" 
              step="0.1"
              min="0"
              max="1"
              value={config.p || 0.5} 
              onChange={(e) => handleChange('p', parseFloat(e.target.value))}
              style={{ width: '100%', padding: '5px', backgroundColor: '#444', border: 'none', color: 'white' }}
            />
          </div>
        );
      default:
        return <div style={{ color: '#aaa' }}>No configuration for this layer type.</div>;
    }
  };

  return (
    <aside style={{ 
      width: '250px', 
      padding: '15px', 
      borderLeft: '1px solid #444', 
      backgroundColor: '#222',
      color: 'white'
    }}>
      <div style={{ marginBottom: '15px', fontWeight: 'bold', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
        Configuration: {selectedNode.data.label}
      </div>
      {renderFields()}
    </aside>
  );
};

export default ConfigPanel;
