// src/api/analysisApi.js

import { pythonClient } from './client';

export const analyzeVideo = (videoFile) => {
  const formData = new FormData();
  formData.append('video', videoFile);

  return pythonClient.post('/combined-analysis', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const checkHealth = () => {
  return pythonClient.get('/health');
};