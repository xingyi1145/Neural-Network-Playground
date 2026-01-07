import client from './client';

export const getTemplates = async () => {
  const response = await client.get('/templates');
  return response.data;
};

export const createModel = async (modelData) => {
  const response = await client.post('/models', modelData);
  return response.data;
};

export const getDatasets = async () => {
  const response = await client.get('/datasets');
  return response.data;
};
