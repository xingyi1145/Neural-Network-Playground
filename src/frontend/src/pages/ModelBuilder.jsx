import React, { useState, useCallback } from 'react';
import { useNodesState, useEdgesState, addEdge } from 'reactflow';
import Layout from '../components/Layout';
import LayerPalette from '../components/LayerPalette';
import ConfigPanel from '../components/ConfigPanel';
import Canvas from '../components/Canvas';
import TemplateModal from '../components/TemplateModal';

const ModelBuilder = ({ onNavigateToTraining }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [modelName, setModelName] = useState('My Model');
  const [isSaving, setIsSaving] = useState(false);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const handleConfigChange = (nodeId, newConfig) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, config: newConfig } };
        }
        return node;
      })
    );
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const handleSaveModel = async () => {
    // Convert graph to sequential layer list
    // 1. Find start node (node with no incoming edges, or just the first one if disconnected)
    // For now, let's try to sort by position or just follow edges.
    // A simple approach for a linear chain:
    // Find node with no target handle connected.
    
    // Better: Topological sort or just follow the chain.
    // Let's assume the user builds a valid chain.
    // We can start finding the node that is not a target of any edge.
    
    const targetNodeIds = new Set(edges.map(e => e.target));
    const startNodes = nodes.filter(n => !targetNodeIds.has(n.id));
    
    if (startNodes.length === 0 && nodes.length > 0) {
      alert("Cycle detected or no start node found!");
      return;
    }
    
    if (startNodes.length > 1) {
      alert("Multiple start nodes found! Please connect them in a single chain.");
      return;
    }

    const layers = [];
    let currentNode = startNodes[0];
    
    while (currentNode) {
      layers.push({
        type: currentNode.data.type,
        config: currentNode.data.config
      });
      
      const edge = edges.find(e => e.source === currentNode.id);
      if (edge) {
        currentNode = nodes.find(n => n.id === edge.target);
      } else {
        currentNode = null;
      }
    }

    const modelConfig = {
      name: modelName,
      layers: layers
    };

    setIsSaving(true);
    try {
      console.log("Saving model:", modelConfig);
      // await createModel(modelConfig); // API call
      // For now, just log and maybe navigate
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
      alert("Model saved! (Simulated)");
      if (onNavigateToTraining) {
        onNavigateToTraining();
      }
    } catch (error) {
      console.error("Failed to save model", error);
      alert("Failed to save model");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadTemplate = (template) => {
    // Convert template layers to nodes/edges
    // This is a placeholder implementation
    const newNodes = [];
    const newEdges = [];
    let y = 100;
    
    template.layers.forEach((layer, index) => {
      const id = `node_${index}`;
      newNodes.push({
        id,
        type: 'default',
        position: { x: 250, y },
        data: { label: `${layer.type} node`, type: layer.type, config: layer.config || {} },
        style: { 
            background: '#333', 
            color: '#fff', 
            border: '1px solid #777', 
            width: 150,
            padding: 10,
            borderRadius: 5
        },
      });
      
      if (index > 0) {
        newEdges.push({
          id: `e${index-1}-${index}`,
          source: `node_${index-1}`,
          target: id
        });
      }
      
      y += 100;
    });
    
    setNodes(newNodes);
    setEdges(newEdges);
    setIsTemplateModalOpen(false);
    setModelName(template.name || 'Loaded Template');
  };

  const headerContent = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', width: '100%' }}>
      <h2 style={{ margin: 0, color: 'white' }}>Model Builder</h2>
      <input 
        value={modelName} 
        onChange={(e) => setModelName(e.target.value)}
        style={{ 
          padding: '5px', 
          borderRadius: '4px', 
          border: '1px solid #555', 
          backgroundColor: '#222', 
          color: 'white' 
        }}
      />
      <div style={{ flex: 1 }}></div>
      <button onClick={() => setIsTemplateModalOpen(true)} style={{ padding: '8px 16px', cursor: 'pointer', marginRight: '10px' }}>Load Template</button>
      <button 
        onClick={handleSaveModel} 
        disabled={isSaving}
        style={{ 
          padding: '8px 16px', 
          cursor: isSaving ? 'not-allowed' : 'pointer', 
          backgroundColor: isSaving ? '#45a049' : '#4CAF50', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          opacity: isSaving ? 0.7 : 1
        }}
      >
        {isSaving ? 'Saving...' : 'Create Model'}
      </button>
    </div>
  );

  return (
    <Layout header={headerContent}>
      <LayerPalette />
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas 
          nodes={nodes} 
          edges={edges} 
          onNodesChange={onNodesChange} 
          onEdgesChange={onEdgesChange} 
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          setNodes={setNodes}
        />
      </div>
      <ConfigPanel selectedNode={selectedNode} onChange={handleConfigChange} />
      <TemplateModal 
        isOpen={isTemplateModalOpen} 
        onClose={() => setIsTemplateModalOpen(false)} 
        onSelect={handleLoadTemplate} 
      />
    </Layout>
  );
};

export default ModelBuilder;
