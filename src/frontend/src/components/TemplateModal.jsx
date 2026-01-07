import React, { useState, useEffect } from 'react';
import { getTemplates } from '../api/models';

const TemplateModal = ({ isOpen, onClose, onSelect }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getTemplates()
        .then(data => setTemplates(data))
        .catch(err => console.error("Failed to load templates", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#333',
        padding: '20px',
        borderRadius: '8px',
        width: '500px',
        maxHeight: '80vh',
        overflowY: 'auto',
        color: 'white',
        border: '1px solid #555'
      }}>
        <h2 style={{ marginTop: 0 }}>Load Template</h2>
        
        {loading ? (
          <p>Loading templates...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {templates.length === 0 && <p>No templates found.</p>}
            {templates.map(template => (
              <div 
                key={template.id}
                onClick={() => onSelect(template)}
                style={{
                  padding: '10px',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: '#444',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#555'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#444'}
              >
                <div style={{ fontWeight: 'bold' }}>{template.name}</div>
                <div style={{ fontSize: '0.9em', color: '#ccc' }}>{template.description}</div>
              </div>
            ))}
          </div>
        )}

        <button 
          onClick={onClose}
          style={{
            marginTop: '20px',
            padding: '8px 16px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default TemplateModal;
