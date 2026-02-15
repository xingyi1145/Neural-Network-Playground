import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { useModel } from '../context/ModelContext';
import LayerConfigModal from './LayerConfigModal';
import ExportPreviewModal from './ExportPreviewModal';
import Tooltip from './Tooltip';
import { downloadModelPy, generateModelPy } from '../utils/modelExport';

// Image layer types that require image data
const IMAGE_LAYER_TYPES = ['conv2d', 'maxpooling2d', 'avgpooling2d', 'flatten'];
const CONV_LIKE_TYPES = ['conv2d', 'maxpooling2d', 'avgpooling2d'];

const shapeToFeatureCount = (shape) => {
  if (Array.isArray(shape)) {
    return shape.reduce((acc, dim) => {
      const size = Number(dim);
      return Number.isFinite(size) && size > 0 ? acc * size : acc;
    }, 1);
  }
  const num = Number(shape);
  return Number.isFinite(num) && num > 0 ? num : null;
};

const isLikelyImageDataset = (dataset) => {
  if (!dataset) return false;
  const shape = dataset.input_shape;
  if (Array.isArray(shape)) return shape.length >= 2;
  const lowerName = dataset.name?.toLowerCase() || '';
  return lowerName.includes('mnist');
};

const describeInputShape = (dataset) => {
  if (!dataset) return '';
  if (Array.isArray(dataset.input_shape)) return dataset.input_shape.join('×');
  if (dataset.input_shape) return dataset.input_shape;
  if (dataset.num_features) return `${dataset.num_features} features`;
  return '';
};

// Pre-made neural network templates
const MODEL_TEMPLATES = [
  {
    id: 'tiny-classifier',
    name: 'Tiny Classifier',
    description: 'Two small layers for tabular datasets (Iris, Wine, Synthetic).',
    layers: [
      { type: 'dense', units: 16, activation: 'relu' },
      { type: 'dense', units: 8, activation: 'relu' },
    ],
  },
  {
    id: 'compact-classifier',
    name: 'Compact Classifier',
    description: 'A bit more capacity without overfitting small datasets.',
    layers: [
      { type: 'dense', units: 32, activation: 'relu' },
      { type: 'dense', units: 16, activation: 'relu' },
    ],
  },
  {
    id: 'mnist-friendly',
    name: 'MNIST Friendly',
    description: 'Shallow dense stack sized for MNIST without going overboard.',
    layers: [
      { type: 'dense', units: 64, activation: 'relu' },
      { type: 'dense', units: 32, activation: 'relu' },
      { type: 'dense', units: 16, activation: 'relu' },
    ],
  },
  {
    id: 'regression',
    name: 'Regression Baseline',
    description: 'Lightweight regression stack for housing or similar.',
    layers: [
      { type: 'dense', units: 32, activation: 'relu' },
      { type: 'dense', units: 16, activation: 'relu' },
      { type: 'dense', units: 8, activation: 'relu' },
    ],
  },
  {
    id: 'single-wide',
    name: 'Single Wide',
    description: 'One broad layer to test quick baselines.',
    layers: [
      { type: 'dense', units: 32, activation: 'relu' },
    ],
  },
];

// Layer type styles with colors AND unique shapes/sizes for visual distinction
const LAYER_STYLES = {
  dense: { 
    bg: 'bg-blue-600', bgDark: 'bg-blue-700', border: 'border-blue-400', 
    shadow: 'shadow-blue-900/50',
    minWidth: 'min-w-[280px]',
    padding: 'px-4 py-3',
    rounded: 'rounded-xl',
    icon: '◆' // Diamond
  },
  dropout: { 
    bg: 'bg-amber-500', bgDark: 'bg-amber-600', border: 'border-amber-300', 
    shadow: 'shadow-amber-900/50',
    minWidth: 'min-w-[200px]',
    padding: 'px-4 py-2',
    rounded: 'rounded-2xl',
    icon: '○' // Circle (represents dropping)
  },
  conv2d: { 
    bg: 'bg-violet-600', bgDark: 'bg-violet-700', border: 'border-violet-400', 
    shadow: 'shadow-violet-900/50',
    minWidth: 'min-w-[300px]',
    padding: 'px-4 py-4',
    rounded: 'rounded-2xl',
    icon: '▦' // Grid pattern
  },
  maxpooling2d: { 
    bg: 'bg-fuchsia-600', bgDark: 'bg-fuchsia-700', border: 'border-fuchsia-400', 
    shadow: 'shadow-fuchsia-900/50',
    minWidth: 'min-w-[240px]',
    padding: 'px-4 py-3',
    rounded: 'rounded-xl',
    icon: '▼' // Downward (pooling reduces)
  },
  avgpooling2d: { 
    bg: 'bg-pink-500', bgDark: 'bg-pink-600', border: 'border-pink-300', 
    shadow: 'shadow-pink-900/50',
    minWidth: 'min-w-[240px]',
    padding: 'px-4 py-3',
    rounded: 'rounded-xl',
    icon: '▽'
  },
  flatten: { 
    bg: 'bg-orange-500', bgDark: 'bg-orange-600', border: 'border-orange-300', 
    shadow: 'shadow-orange-900/50',
    minWidth: 'min-w-[180px]',
    padding: 'px-4 py-2',
    rounded: 'rounded-lg',
    icon: '═' // Flat line
  },
};

// Input/Output special styles
const INPUT_STYLE = {
  bg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
  bgDark: 'bg-gradient-to-r from-emerald-600 to-teal-600',
  border: 'border-emerald-300',
  minWidth: 'min-w-[260px]',
  padding: 'px-4 py-3',
  rounded: 'rounded-xl',
};

const OUTPUT_STYLE = {
  bg: 'bg-gradient-to-r from-rose-500 to-red-500',
  bgDark: 'bg-gradient-to-r from-rose-600 to-red-600',
  border: 'border-rose-300',
  minWidth: 'min-w-[260px]',
  padding: 'px-4 py-3',
  rounded: 'rounded-xl',
};

// Modern connected block component with smooth animations - varied shapes per layer type
const ScratchBlock = ({ type, children, isInput, isOutput, color, onEdit, onDelete, isDragging, isDropTarget, isLast, style }) => {
  // Use special styles for input/output, otherwise use layer styles
  let styles;
  if (isInput) {
    styles = INPUT_STYLE;
  } else if (isOutput) {
    styles = OUTPUT_STYLE;
  } else {
    styles = color || LAYER_STYLES[type] || { 
      bg: 'bg-gray-600', bgDark: 'bg-gray-700', border: 'border-gray-400', 
      shadow: 'shadow-gray-900/50', minWidth: 'min-w-[260px]', padding: 'px-4 py-3', rounded: 'rounded-lg'
    };
  }
  
  const blockMinWidth = styles.minWidth || 'min-w-[260px]';
  const blockPadding = styles.padding || 'px-4 py-3';
  const blockRounded = styles.rounded || 'rounded-lg';
  
  return (
    <div 
      className={`
        relative select-none
        transition-transform duration-200 ease-out
        ${isDragging ? 'z-50' : 'z-10'}
      `}
      style={style}
    >
      {/* Drop target indicator */}
      {isDropTarget && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-[90%] h-1 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50" />
      )}
      
      {/* Main block with 3D effect */}
      <div className={`
        relative
        ${isDragging ? 'scale-105 rotate-1' : 'scale-100 rotate-0'}
        transition-all duration-200 ease-out
      `}>
        {/* Block shadow/depth layer */}
        <div className={`
          absolute inset-0 ${styles.bgDark || styles.bg} ${blockRounded}
          translate-y-1
          ${isDragging ? 'translate-y-2' : ''}
          transition-transform duration-200
        `} />
        
        {/* Main block surface */}
        <div className={`
          relative ${styles.bg}
          ${blockRounded}
          ${blockPadding}
          ${blockMinWidth}
          ${!isInput && !isOutput ? 'cursor-grab active:cursor-grabbing' : ''}
          border-t border-l border-white/20
          ${isDragging ? 'shadow-2xl shadow-black/50' : 'shadow-lg'}
          transition-shadow duration-200
        `}>
          {/* Top connector nub (receives from above) - all blocks except input */}
          {!isInput && (
            <div className="absolute -top-[8px] left-1/2 -translate-x-1/2">
              <div className={`w-8 h-[8px] ${isOutput ? 'bg-rose-500' : (LAYER_STYLES[type]?.bg || 'bg-gray-600')} rounded-t-md border-t border-l border-r border-white/10`} />
            </div>
          )}
          
          {/* Bottom connector tab (sends to below) - all blocks except the last one */}
          {!isLast && (
            <div className="absolute -bottom-[8px] left-1/2 -translate-x-1/2">
              <div className={`w-8 h-[8px] ${isInput ? 'bg-emerald-600' : (LAYER_STYLES[type]?.bgDark || styles.bgDark || 'bg-gray-700')} rounded-b-md`} />
            </div>
          )}
          
          {/* Block content with action buttons */}
          <div className="flex items-center gap-3">
            <div className="flex-1 text-white">
              {children}
            </div>
            {/* Action buttons - positioned consistently on the right */}
            {onEdit && onDelete && (
              <div className="flex flex-col gap-1 ml-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="p-1.5 bg-white/10 hover:bg-white/25 rounded-md transition-colors"
                  title="Edit layer"
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="p-1.5 bg-white/10 hover:bg-red-500/60 rounded-md transition-colors"
                  title="Delete layer"
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const GuidanceBadge = ({ notes }) => {
  if (!notes || notes.length === 0) return null;
  const message = notes.join(' • ');
  return (
    <Tooltip text={message} position="right">
      <button
        type="button"
        aria-label="Layer guidance"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className="w-5 h-5 rounded-full bg-amber-400/15 border border-amber-300/50 text-[10px] text-amber-100 flex items-center justify-center hover:bg-amber-400/25 hover:border-amber-200/70 transition-colors shadow-sm shadow-amber-900/30"
      >
        !
      </button>
    </Tooltip>
  );
};

const ModelCanvas = () => {
  const { model, selectedDataset, addLayer, updateLayer, removeLayer, setLayers, reorderLayers, updateModelValidation } = useModel();
  const [showLayerModal, setShowLayerModal] = useState(false);
  const [editingLayer, setEditingLayer] = useState(null);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  
  // Zoom state
  const [zoom, setZoom] = useState(1.0);
  const canvasRef = useRef(null);
  
  // Smooth drag state
  const [dragState, setDragState] = useState({
    isDragging: false,
    draggedIndex: null,
    dropTargetIndex: null,
    startY: 0,
    currentY: 0,
    dragOffset: 0,
  });
  const layerRefs = useRef([]);
  const containerRef = useRef(null);
  
  const [exportPreview, setExportPreview] = useState({
    open: false,
    code: '',
    config: null,
    inputFeatures: null,
    outputFeatures: null,
  });
  const templateMenuRef = useRef(null);
  const isImageDataset = useMemo(() => isLikelyImageDataset(selectedDataset), [selectedDataset]);

  // Close template menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (templateMenuRef.current && !templateMenuRef.current.contains(event.target)) {
        setShowTemplateMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Validate model - simpler now since blocks are always connected in sequence
  useEffect(() => {
    const warnings = [];
    let hasValidConnections = model.layers.length > 0;
    let connectionError = model.layers.length === 0 ? 'Add at least one layer to your model' : '';

    const imageLayers = model.layers.filter(layer => 
      IMAGE_LAYER_TYPES.includes(layer.type)
    );

    if (imageLayers.length > 0 && selectedDataset && !isImageDataset) {
      warnings.push(`Image layers (${imageLayers.map(l => l.type).join(', ')}) are designed for image data. Current dataset "${selectedDataset?.name || 'unknown'}" may not be compatible.`);
    }

    updateModelValidation({ hasValidConnections, connectionError, warnings });
  }, [model.layers, selectedDataset, isImageDataset, updateModelValidation]);

  const layerGuidance = useMemo(() => {
    const guidance = {};
    const hasDataset = Boolean(selectedDataset);
    const datasetShapeText = describeInputShape(selectedDataset);
    let dim = isImageDataset ? '2d' : hasDataset ? '1d' : 'unknown';
    let dimSource = isImageDataset ? 'dataset-image' : hasDataset ? 'dataset-1d' : 'unknown';

    model.layers.forEach((layer) => {
      const notes = [];

      if (CONV_LIKE_TYPES.includes(layer.type)) {
        if (dim === '1d') {
          if (dimSource === 'dataset-1d' && hasDataset) {
            notes.push(`"${selectedDataset?.name || 'This dataset'}" looks 1D${datasetShapeText ? ` (${datasetShapeText})` : ''}. 2D layers expect height×width images—try Dense layers or pick an image dataset.`);
          } else if (dimSource === 'flatten' || dimSource === 'dense') {
            notes.push('This 2D layer is seeing flattened vectors. Move it above Flatten or keep the stack in 1D with Dense layers.');
          } else {
            notes.push('2D layers expect image-shaped inputs. Make sure data has height×width channels before this block.');
          }
        }
        dim = '2d';
        dimSource = 'conv';
      } else if (layer.type === 'flatten') {
        if (dim === '1d') {
          if (dimSource === 'dataset-1d' && hasDataset) {
            notes.push(`The data is already flat${datasetShapeText ? ` (${datasetShapeText})` : ''}; Flatten here is optional.`);
          } else if (dimSource === 'dense') {
            notes.push('The stack is already 1D after Dense layers; Flatten is usually unnecessary here.');
          }
        }
        dim = '1d';
        dimSource = 'flatten';
      } else if (layer.type === 'dense') {
        if (dim === '2d') {
          notes.push('Add a Flatten layer right before this Dense layer to collapse the 2D feature maps into a vector.');
        }
        dim = '1d';
        dimSource = 'dense';
      }

      if (notes.length) {
        guidance[layer.id] = notes;
      }
    });

    return guidance;
  }, [model.layers, selectedDataset, isImageDataset]);

  const handleLoadTemplate = useCallback((template) => {
    setLayers(template.layers);
    setShowTemplateMenu(false);
  }, [setLayers]);

  const handleEditLayer = useCallback((layer) => {
    setEditingLayer(layer);
    setShowLayerModal(true);
  }, []);

  const handleDeleteLayer = useCallback((layerId) => {
    removeLayer(layerId);
  }, [removeLayer]);

  const handleAddLayer = useCallback(() => {
    setEditingLayer(null);
    setShowLayerModal(true);
  }, []);

  const handleSaveLayer = useCallback((layerConfig) => {
    if (editingLayer) {
      updateLayer(editingLayer.id, layerConfig);
    } else {
      addLayer(layerConfig);
    }
    setShowLayerModal(false);
    setEditingLayer(null);
  }, [editingLayer, addLayer, updateLayer]);

  const handleCloseModal = useCallback(() => {
    setShowLayerModal(false);
    setEditingLayer(null);
  }, []);

  // Drag and drop handlers - smooth pointer-based dragging
  const handlePointerDown = useCallback((e, index) => {
    e.preventDefault();
    e.target.setPointerCapture(e.pointerId);
    
    const rect = layerRefs.current[index]?.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    
    setDragState({
      isDragging: true,
      draggedIndex: index,
      dropTargetIndex: null,
      startY: e.clientY,
      currentY: e.clientY,
      dragOffset: rect ? e.clientY - rect.top : 0,
      containerTop: containerRect?.top || 0,
    });
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!dragState.isDragging) return;
    
    const newY = e.clientY;
    setDragState(prev => ({ ...prev, currentY: newY }));
    
    // Find which layer we're hovering over
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    
    let newDropTarget = null;
    layerRefs.current.forEach((ref, idx) => {
      if (ref && idx !== dragState.draggedIndex) {
        const rect = ref.getBoundingClientRect();
        if (newY > rect.top && newY < rect.bottom) {
          newDropTarget = idx;
        } else if (newY < rect.top && idx === 0) {
          newDropTarget = 0;
        }
      }
    });
    
    // Determine drop position based on cursor position relative to other layers
    if (newDropTarget === null) {
      // Check if we're above or below all layers
      layerRefs.current.forEach((ref, idx) => {
        if (ref && idx !== dragState.draggedIndex) {
          const rect = ref.getBoundingClientRect();
          if (newY < rect.top && (newDropTarget === null || idx < newDropTarget)) {
            newDropTarget = idx;
          } else if (newY > rect.bottom && (newDropTarget === null || idx > newDropTarget)) {
            newDropTarget = idx + 1;
          }
        }
      });
    }
    
    if (newDropTarget !== dragState.dropTargetIndex) {
      setDragState(prev => ({ ...prev, dropTargetIndex: newDropTarget }));
    }
  }, [dragState.isDragging, dragState.draggedIndex, dragState.dropTargetIndex]);

  const handlePointerUp = useCallback((e) => {
    if (!dragState.isDragging) return;
    
    e.target.releasePointerCapture(e.pointerId);
    
    const { draggedIndex, dropTargetIndex } = dragState;
    
    if (draggedIndex !== null && dropTargetIndex !== null && draggedIndex !== dropTargetIndex) {
      const newLayers = [...model.layers];
      const [draggedLayer] = newLayers.splice(draggedIndex, 1);
      const insertIndex = dropTargetIndex > draggedIndex ? dropTargetIndex - 1 : dropTargetIndex;
      newLayers.splice(insertIndex, 0, draggedLayer);
      reorderLayers(newLayers);
    }
    
    setDragState({
      isDragging: false,
      draggedIndex: null,
      dropTargetIndex: null,
      startY: 0,
      currentY: 0,
      dragOffset: 0,
    });
  }, [dragState, model.layers, reorderLayers]);

  // Calculate drag transform for smooth movement
  const getDragStyle = useCallback((index) => {
    if (!dragState.isDragging || dragState.draggedIndex !== index) {
      return {};
    }
    
    const translateY = dragState.currentY - dragState.startY;
    return {
      transform: `translateY(${translateY}px)`,
      zIndex: 100,
      pointerEvents: 'none',
    };
  }, [dragState]);

  const handleExportModel = useCallback(() => {
    if (!selectedDataset) {
      alert('Select a dataset first so the input and output sizes are defined.');
      return;
    }

    const inputFeatures = shapeToFeatureCount(
      selectedDataset.input_shape || selectedDataset.num_features || model.inputShape
    );
    const outputFeatures = shapeToFeatureCount(
      selectedDataset.num_classes || selectedDataset.output_shape || model.outputShape
    );

    if (!inputFeatures || !outputFeatures) {
      alert('Missing input/output dimensions. Try selecting a dataset again.');
      return;
    }

    try {
      const config = {
        layers: model.layers,
        inputFeatures,
        outputFeatures,
        taskType: selectedDataset.task_type,
        datasetName: selectedDataset.name,
      };
      const code = generateModelPy(config);
      setExportPreview({
        open: true,
        code,
        config,
        inputFeatures,
        outputFeatures,
      });
    } catch (err) {
      console.error('Failed to export model.py', err);
      alert(err.message || 'Could not export model.py');
    }
  }, [model.layers, model.inputShape, model.outputShape, selectedDataset]);

  const closeExportPreview = useCallback(() => {
    setExportPreview((prev) => ({
      ...prev,
      open: false,
    }));
  }, []);

  const handleDownloadExport = useCallback(() => {
    if (!exportPreview.config) return;
    try {
      downloadModelPy(exportPreview.config, 'model.py');
      closeExportPreview();
    } catch (err) {
      console.error('Failed to download model.py', err);
      alert(err.message || 'Could not download model.py');
    }
  }, [exportPreview.config, closeExportPreview]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.1, 2.0));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(1.0);
  }, []);

  const handleWheel = useCallback((e) => {
    // Zoom with Ctrl/Cmd + wheel
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.max(0.5, Math.min(2.0, prev + delta)));
    }
  }, []);

  // Get layer display info with icons
  const getLayerInfo = (layer) => {
    const style = LAYER_STYLES[layer.type] || {};
    switch (layer.type) {
      case 'dense':
        return { name: 'Dense', detail: `${layer.units} units • ${layer.activation}`, icon: style.icon || '◆' };
      case 'dropout':
        return { name: 'Dropout', detail: `rate: ${layer.rate}`, icon: style.icon || '○' };
      case 'conv2d':
        return { name: 'Conv2D', detail: `${layer.filters} filters • ${layer.kernelSize}×${layer.kernelSize}`, icon: style.icon || '▦' };
      case 'maxpooling2d':
        return { name: 'MaxPool2D', detail: `${layer.poolSize}×${layer.poolSize}`, icon: style.icon || '▼' };
      case 'avgpooling2d':
        return { name: 'AvgPool2D', detail: `${layer.poolSize}×${layer.poolSize}`, icon: style.icon || '▽' };
      case 'flatten':
        return { name: 'Flatten', detail: 'Reshape to 1D', icon: style.icon || '═' };
      default:
        return { name: layer.type, detail: '', icon: '■' };
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 bg-gradient-to-r from-gray-750 to-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Step indicator */}
          <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Step 2: Build Model</h2>
            <p className="text-[10px] text-gray-400">Stack layers from top to bottom • Drag to reorder</p>
          </div>
        </div>
        <div className="flex items-center gap-2 relative" ref={templateMenuRef}>
          <Tooltip text="Load a prebuilt starter network. This replaces the current layers." position="bottom">
            <button
              onClick={() => setShowTemplateMenu(!showTemplateMenu)}
              className="px-2.5 py-1.5 bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs font-medium border border-amber-500/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              Templates
            </button>
          </Tooltip>
          
          {/* Template Dropdown Menu */}
          {showTemplateMenu && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-700 bg-gray-750">
                <h3 className="text-sm font-semibold text-white">Load Template</h3>
                <p className="text-xs text-gray-400 mt-0.5">Replace current model with a pre-made architecture</p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {MODEL_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleLoadTemplate(template)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="text-sm font-medium text-white">{template.name}</div>
                      <div className="text-xs text-gray-400">{template.description}</div>
                      <div className="flex flex-wrap gap-1">
                        {template.layers.map((layer, idx) => (
                          <span
                            key={idx}
                            className={`text-xs px-1.5 py-0.5 rounded ${
                              layer.type === 'dense' ? 'bg-blue-600/30 text-blue-300' :
                              layer.type === 'dropout' ? 'bg-yellow-600/30 text-yellow-300' :
                              layer.type === 'conv2d' ? 'bg-purple-600/30 text-purple-300' :
                              layer.type === 'flatten' ? 'bg-orange-600/30 text-orange-300' :
                              'bg-gray-600/30 text-gray-300'
                            }`}
                          >
                            {layer.type === 'dense' ? `Dense(${layer.units})` :
                             layer.type === 'dropout' ? `Dropout(${layer.rate})` :
                             layer.type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <Tooltip text="Add another hidden layer to your model." position="left">
            <button
              onClick={handleAddLayer}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Layer
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Scratch-style Block Stack */}
      <div 
        ref={canvasRef}
        className="flex-1 bg-gradient-to-b from-gray-900 to-gray-850 overflow-auto"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        style={{ cursor: 'default' }}
      >
        <div 
          className="flex flex-col items-center py-8 min-h-full transition-transform duration-200 ease-out"
          style={{ 
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
          }}
        >
          {/* Flow direction indicator */}
          <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
            <span>Data flows</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span>top to bottom</span>
          </div>

          {/* Block Stack Container with side Add button */}
          <div className="flex items-start gap-4" ref={containerRef}>
            {/* Main block stack - all connected */}
            <div className="flex flex-col items-center">
              {/* Input Block - Fixed at top */}
              <ScratchBlock 
                type="input" 
                isInput={true}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center border border-white/30 shadow-inner">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-sm flex items-center gap-2">
                      Input Layer
                      <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">START</span>
                    </div>
                    <div className="text-xs text-white/80">
                      {selectedDataset 
                        ? `${Array.isArray(selectedDataset.input_shape) ? selectedDataset.input_shape.join('×') : selectedDataset.input_shape || selectedDataset.num_features} features`
                        : 'Select dataset'}
                    </div>
                  </div>
                </div>
              </ScratchBlock>

              {/* Hidden Layers - Draggable */}
              {model.layers.length === 0 ? (
                // Empty state - compact prompt
                <div className="my-1 py-3 px-4 border-2 border-dashed border-gray-700 rounded-lg text-gray-500 text-xs text-center min-w-[260px]">
                  No hidden layers yet
                </div>
              ) : (
                model.layers.map((layer, index) => {
                  const layerInfo = getLayerInfo(layer);
                  const guidanceNotes = layerGuidance[layer.id] || [];
                  const isDragging = dragState.isDragging && dragState.draggedIndex === index;
                  const isDropTarget = dragState.isDragging && 
                    dragState.dropTargetIndex === index && 
                    dragState.draggedIndex !== index;
                  
                  return (
                    <div 
                      key={layer.id} 
                      ref={el => layerRefs.current[index] = el}
                      className="flex flex-col items-center"
                      style={getDragStyle(index)}
                    >
                      <div
                        onPointerDown={(e) => handlePointerDown(e, index)}
                        className="touch-none"
                      >
                        <ScratchBlock
                          type={layer.type}
                          onEdit={() => handleEditLayer(layer)}
                          onDelete={() => handleDeleteLayer(layer.id)}
                          isDragging={isDragging}
                          isDropTarget={isDropTarget}
                          layerData={layer}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center border border-white/10">
                              <span className="text-lg">{layerInfo.icon}</span>
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-sm flex items-center gap-2">
                                {layerInfo.name}
                                <span className="text-[10px] font-normal text-white/50">#{index + 1}</span>
                                {guidanceNotes.length > 0 && <GuidanceBadge notes={guidanceNotes} />}
                              </div>
                              {layerInfo.detail && (
                                <div className="text-xs text-white/70">{layerInfo.detail}</div>
                              )}
                            </div>
                          </div>
                        </ScratchBlock>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Output Block - Fixed at bottom, connected to everything above */}
              <ScratchBlock 
                type="output" 
                isOutput={true}
                isLast={true}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center border border-white/30 shadow-inner">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-sm flex items-center gap-2">
                      Output Layer
                      <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">END</span>
                    </div>
                    <div className="text-xs text-white/80">
                      {selectedDataset 
                        ? `${selectedDataset.num_classes || selectedDataset.output_shape || 1} ${selectedDataset.task_type === 'classification' ? 'classes' : 'outputs'}`
                        : 'Auto-configured'}
                    </div>
                  </div>
                </div>
              </ScratchBlock>
            </div>

            {/* Add Layer + button - positioned to the right of the last blocks */}
            <div className="flex flex-col items-center justify-end" style={{ marginTop: 'auto', marginBottom: '24px' }}>
              <button
                onClick={handleAddLayer}
                className="w-8 h-8 rounded-full bg-gray-700/50 hover:bg-blue-600 border border-gray-600 hover:border-blue-500 flex items-center justify-center transition-all hover:scale-110"
                title="Add a hidden layer"
              >
                <svg className="w-4 h-4 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="px-4 py-2 border-t border-gray-700 bg-gray-750">
        {model.layers.length === 0 ? (
          <div className="flex items-center gap-2 text-xs">
            <svg className="w-4 h-4 text-blue-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-blue-300">
              {selectedDataset 
                ? 'Click "Add Layer" or load a template to start building your model'
                : 'Select a dataset first, then add layers to build your model'
              }
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-gray-300">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                {model.layers.length} layer{model.layers.length !== 1 ? 's' : ''}
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-emerald-400">Ready to train</span>
            </div>
            <div className="flex items-center gap-3">
              {selectedDataset && (
                <span className="px-2 py-0.5 bg-gray-700 rounded text-gray-400">
                  {selectedDataset.name}
                </span>
              )}
              <Tooltip text="Download a model.py file matching your architecture." position="top">
                <button
                  onClick={handleExportModel}
                  className="px-2 py-1 bg-gray-700 hover:bg-purple-600/50 text-gray-300 hover:text-white text-xs font-medium rounded transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v12m0 0l-4-4m4 4l4-4M6 20h12" />
                  </svg>
                  Export
                </button>
              </Tooltip>
              
              {/* Zoom Controls - Less prominent */}
              <div className="flex items-center gap-1 border-l border-gray-700 pl-3 ml-3">
                <Tooltip text="Zoom out (Ctrl/Cmd + Scroll)" position="top">
                  <button
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                    className="px-1.5 py-1 bg-gray-700/50 hover:bg-gray-600/50 disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 hover:text-gray-300 rounded transition-colors flex items-center justify-center"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                </Tooltip>
                <Tooltip text={`Zoom: ${Math.round(zoom * 100)}% (Click to reset)`} position="top">
                  <button
                    onClick={handleZoomReset}
                    className="px-2 py-1 bg-gray-700/50 hover:bg-gray-600/50 text-gray-400 hover:text-gray-300 text-[10px] font-medium rounded transition-colors min-w-[45px]"
                  >
                    {Math.round(zoom * 100)}%
                  </button>
                </Tooltip>
                <Tooltip text="Zoom in (Ctrl/Cmd + Scroll)" position="top">
                  <button
                    onClick={handleZoomIn}
                    disabled={zoom >= 2.0}
                    className="px-1.5 py-1 bg-gray-700/50 hover:bg-gray-600/50 disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 hover:text-gray-300 rounded transition-colors flex items-center justify-center"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Layer Config Modal */}
      {showLayerModal && (
        <LayerConfigModal
          layer={editingLayer}
          onSave={handleSaveLayer}
          onClose={handleCloseModal}
          selectedDataset={selectedDataset}
        />
      )}

      <ExportPreviewModal
        isOpen={exportPreview.open}
        code={exportPreview.code}
        onClose={closeExportPreview}
        onDownload={handleDownloadExport}
        datasetName={selectedDataset?.name}
        inputFeatures={exportPreview.inputFeatures}
        outputFeatures={exportPreview.outputFeatures}
      />
    </div>
  );
};

export default ModelCanvas;
