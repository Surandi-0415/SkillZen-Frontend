// src/api/interviewApi.js

import { nodeClient, pythonClient } from './client';

// ============================================================
// Python Backend (ML/AI Analysis)
// ============================================================

export const analyzeAnswer = (jd, question, videoFile) => {
  const formData = new FormData();
  formData.append('jd', jd);
  formData.append('question', question);
  formData.append('video', videoFile);

  return pythonClient.post('/submit-answer', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      console.log(`Upload Progress: ${percentCompleted}%`);
    },
  });
};

// ============================================================
// GENERATE FEEDBACK
// ============================================================

export const generateFeedback = (jd, qaList) => {
  console.log("📤 Sending feedback request:", { jd, qaList });

  const formattedQaList = qaList.map(item => ({
    question: String(item.question || ""),
    answer: String(item.answer || item.transcript || ""),
    content_score: Number(item.content_score || 5.0),
    confidence: String(item.confidence || "Moderate"),
    explanation: String(item.explanation || "No explanation provided")
  }));

  return pythonClient.post('/generate-feedback', {
    jd: String(jd || ""),
    qa_list: formattedQaList
  });
};

// ============================================================
// GENERATE QUESTIONS
// ============================================================

export const generateQuestions = (jd, duration = 30) => {
  const formData = new FormData();
  formData.append('jd', jd);
  formData.append('duration', duration);

  return pythonClient.post('/generate-questions', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// ============================================================
// MEET & GREET (WARM-UP) QUESTIONS  (Node.js backend / MongoDB)
// ============================================================
// Fetches a few pre-built warm-up questions instantly so the candidate can
// start the interview without waiting for the (slow) AI question generation.

export const getMeetGreetQuestions = (count = 3) => {
  return nodeClient.get(`/interviews/meet-greet?count=${count}`);
};

// ============================================================
// Node.js Backend (Database)
// ============================================================

export const saveInterview = (data) => {
  return nodeClient.post('/interviews/save', data);
};

export const processAnswer = (jd, question, videoFile, jobTitle = '', company = '') => {
  const formData = new FormData();
  formData.append('jd', jd);
  formData.append('question', question);
  formData.append('video', videoFile);
  if (jobTitle) formData.append('jobTitle', jobTitle);
  if (company) formData.append('company', company);

  return nodeClient.post('/interviews/process-answer', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getInterviewHistory = (page = 1, limit = 10) => {
  return nodeClient.get(`/interviews/history?page=${page}&limit=${limit}`);
};

export const getInterviewAnalytics = () => {
  return nodeClient.get('/interviews/analytics');
};

export const getInterviewById = (id) => {
  return nodeClient.get(`/interviews/${id}`);
};

export const generateInterviewFeedback = (interviewId) => {
  return nodeClient.post(`/interviews/${interviewId}/feedback`);
};