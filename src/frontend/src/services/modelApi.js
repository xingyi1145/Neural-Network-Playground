import api from './api';

// ==================== Dataset APIs ====================

export const fetchDatasets = async () => {
  const response = await api.get('/datasets');
  return response.data;
};

export const fetchDatasetById = async (id) => {
  const response = await api.get(`/datasets/${id}`);
  return response.data;
};

export const uploadDataset = async (formData) => {
  const response = await api.post('/datasets/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

// ==================== Model APIs ====================

export const createModel = async (architecture) => {
  const response = await api.post('/models', architecture);
  return response.data;
};

export const getModel = async (modelId) => {
  const response = await api.get(`/models/${modelId}`);
  return response.data;
};

export const updateModel = async (modelId, architecture) => {
  const response = await api.put(`/models/${modelId}`, architecture);
  return response.data;
};

export const deleteModel = async (modelId) => {
  const response = await api.delete(`/models/${modelId}`);
  return response.data;
};

export const listModels = async () => {
  const response = await api.get('/models');
  return response.data;
};

// ==================== Training APIs ====================

export const startTraining = async (modelId, config) => {
  const response = await api.post(`/models/${modelId}/train`, config);
  return response.data;
};

export const getTrainingStatus = async (trainingId) => {
  const response = await api.get(`/training/${trainingId}/status`);
  return response.data;
};

export const getTrainingMetrics = async (trainingId) => {
  const response = await api.get(`/training/${trainingId}/metrics`);
  return response.data;
};

export const stopTraining = async (trainingId) => {
  const response = await api.post(`/training/${trainingId}/stop`);
  return response.data;
};

export const pauseTraining = async (trainingId) => {
  const response = await api.post(`/training/${trainingId}/pause`);
  return response.data;
};

export const resumeTraining = async (trainingId) => {
  const response = await api.post(`/training/${trainingId}/resume`);
  return response.data;
};

export const getTrainingHistory = async (modelId) => {
  const response = await api.get(`/models/${modelId}/training/history`);
  return response.data;
};

// ==================== Testing/Prediction APIs ====================

export const testModel = async (sessionId, inputs) => {
  const response = await api.post(`/training/${sessionId}/predict`, { inputs });
  return response.data;
};

export const evaluateModel = async (modelId, datasetId) => {
  const response = await api.post(`/models/${modelId}/evaluate`, { dataset_id: datasetId });
  return response.data;
};

// ==================== Export/Import APIs ====================

export const exportModel = async (modelId, format = 'json') => {
  const response = await api.get(`/models/${modelId}/export`, {
    params: { format },
    responseType: 'blob'
  });
  return response.data;
};

export const importModel = async (formData) => {
  const response = await api.post('/models/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};
