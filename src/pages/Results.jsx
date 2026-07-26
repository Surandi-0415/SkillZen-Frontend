// src/pages/Results.jsx

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getInterviewById } from "../api/interviewApi";
import "./Results.css";

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

  const [interviewData, setInterviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get data from location state
  const locationAnswers = location.state?.answers || [];
  const locationReport = location.state?.report || "";

  useEffect(() => {
    if (id) {
      fetchInterviewById(id);
    } else if (locationAnswers.length > 0) {
      setInterviewData({
        answers: locationAnswers,
        report: locationReport,
        overallScore: calculateAverageScore(locationAnswers)
      });
    } else {
      navigate("/dashboard");
    }
  }, [id]);

  const fetchInterviewById = async (interviewId) => {
    try {
      setLoading(true);
      const response = await getInterviewById(interviewId);
      const data = response.data.data;
      setInterviewData({
        answers: data.answers || [],
        report: data.report || "",
        overallScore: data.overallScore || 0,
        jobTitle: data.jobTitle || "Interview",
        createdAt: data.createdAt,
        overallAnalysis: data.overallAnalysis || {}
      });
    } catch (err) {
      console.error("Error fetching interview:", err);
      setError("Could not load interview results.");
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageScore = (answers) => {
    if (answers.length === 0) return 0;
    const total = answers.reduce((sum, a) => sum + Number(a.content_score || 0), 0);
    return parseFloat((total / answers.length).toFixed(1));
  };

  const getScoreBadge = (score) => {
    if (score >= 8) {
      return <span className="badge badge-success">Excellent ({score}/10)</span>;
    }
    if (score >= 5) {
      return <span className="badge badge-warning">Average ({score}/10)</span>;
    }
    return <span className="badge badge-danger">Needs Work ({score}/10)</span>;
  };

  // ✅ NEW: Get confidence level color
  const getConfidenceColor = (level) => {
    const colors = {
      'Excellent': '#10b981',
      'High': '#22c55e',
      'Moderate': '#f59e0b',
      'Fair': '#f97316',
      'Low': '#ef4444',
      'unknown': '#94a3b8'
    };
    return colors[level] || '#94a3b8';
  };

  // ✅ NEW: Render facial analysis
  const renderFacialAnalysis = (ans) => {
    if (!ans.facial_analysis || !ans.facial_analysis.confidence) return null;

    const fa = ans.facial_analysis;
    const emotions = fa.emotional_states || {};

    return (
      <div className="analysis-section facial-analysis">
        <h4>😊 Facial Expression Analysis</h4>
        <div className="analysis-grid">
          <div className="analysis-item">
            <span className="label">Confidence Score</span>
            <span className="value">{(fa.confidence * 100).toFixed(1)}%</span>
          </div>
          <div className="analysis-item">
            <span className="label">Level</span>
            <span className={`value level-${fa.confidence_level?.toLowerCase() || 'unknown'}`}>
              {fa.confidence_level || 'Unknown'}
            </span>
          </div>
          <div className="analysis-item">
            <span className="label">Trend</span>
            <span className="value">{fa.trend || 'stable'}</span>
          </div>
          <div className="analysis-item">
            <span className="label">Frames Analyzed</span>
            <span className="value">{fa.frames_analyzed || 0}</span>
          </div>
        </div>

        {/* Emotional States Bars */}
        <div className="emotion-bars">
          <div className="emotion-bar">
            <span className="emotion-label">😊 Confident</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ 
                width: `${(emotions.confident || 0)}%`,
                backgroundColor: '#10b981'
              }} />
            </div>
            <span className="emotion-value">{(emotions.confident || 0).toFixed(1)}%</span>
          </div>
          <div className="emotion-bar">
            <span className="emotion-label">😐 Neutral</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ 
                width: `${(emotions.neutral || 0)}%`,
                backgroundColor: '#f59e0b'
              }} />
            </div>
            <span className="emotion-value">{(emotions.neutral || 0).toFixed(1)}%</span>
          </div>
          <div className="emotion-bar">
            <span className="emotion-label">😰 Nervous</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ 
                width: `${(emotions.nervous || 0)}%`,
                backgroundColor: '#ef4444'
              }} />
            </div>
            <span className="emotion-value">{(emotions.nervous || 0).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    );
  };

  // ✅ NEW: Render speech analysis
  const renderSpeechAnalysis = (ans) => {
    if (!ans.speech_analysis || !ans.speech_analysis.predicted_emotion) return null;

    const sa = ans.speech_analysis;
    const scores = sa.emotion_scores || {};

    return (
      <div className="analysis-section speech-analysis">
        <h4>🎤 Speech Analysis</h4>
        <div className="analysis-grid">
          <div className="analysis-item">
            <span className="label">Predicted Emotion</span>
            <span className={`value emotion-${sa.predicted_emotion}`}>
              {sa.predicted_emotion}
            </span>
          </div>
          <div className="analysis-item">
            <span className="label">Confidence</span>
            <span className="value">{(sa.confidence_score * 100).toFixed(1)}%</span>
          </div>
          <div className="analysis-item">
            <span className="label">Mode</span>
            <span className="value">{sa.is_fallback ? 'Fallback' : 'AI Model'}</span>
          </div>
        </div>

        {/* Emotion Scores */}
        <div className="emotion-bars">
          <div className="emotion-bar">
            <span className="emotion-label">😊 Confident</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ 
                width: `${(scores.confident || 0) * 100}%`,
                backgroundColor: '#10b981'
              }} />
            </div>
            <span className="emotion-value">{((scores.confident || 0) * 100).toFixed(1)}%</span>
          </div>
          <div className="emotion-bar">
            <span className="emotion-label">🗣️ Clear</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ 
                width: `${(scores.clear || 0) * 100}%`,
                backgroundColor: '#3b82f6'
              }} />
            </div>
            <span className="emotion-value">{((scores.clear || 0) * 100).toFixed(1)}%</span>
          </div>
          <div className="emotion-bar">
            <span className="emotion-label">😰 Nervous</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ 
                width: `${(scores.nervous || 0) * 100}%`,
                backgroundColor: '#ef4444'
              }} />
            </div>
            <span className="emotion-value">{((scores.nervous || 0) * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    );
  };

  // ✅ NEW: Render combined analysis summary
  const renderCombinedAnalysis = (ans) => {
    if (!ans.combined_confidence) return null;

    return (
      <div className="analysis-section combined-analysis">
        <h4>📊 Combined Analysis</h4>
        <div className="combined-metrics">
          <div className="combined-metric">
            <span className="label">Combined Confidence</span>
            <span className="value">{(ans.combined_confidence * 100).toFixed(1)}%</span>
          </div>
          <div className="combined-metric">
            <span className="label">Overall Emotion</span>
            <span className="value">{ans.overall_emotion || 'Unknown'}</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="platform-results-page">
        <Header />
        <main className="platform-container">
          <div className="loading-box">
            <div className="spinner"></div>
            <p>Loading results...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="platform-results-page">
        <Header />
        <main className="platform-container">
          <div className="error-box">
            <h2>Error</h2>
            <p>{error}</p>
            <button className="btn-primary" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const answers = interviewData?.answers || locationAnswers || [];
  const report = interviewData?.report || locationReport || "";
  const totalQuestions = answers.length;
  const avgScore = totalQuestions > 0
    ? answers.reduce((acc, curr) => acc + Number(curr.content_score || 0), 0) / totalQuestions
    : 0;

  return (
    <div className="platform-results-page">
      <Header />

      <main className="platform-container">
        {/* HEADER */}
        <header className="report-header">
          <div>
            <h1 className="report-title">
              {interviewData?.jobTitle || "Interview Performance Report"}
            </h1>
            <p className="report-subtitle">
              {totalQuestions} questions answered • AI Evaluated
              {interviewData?.createdAt && ` • ${new Date(interviewData.createdAt).toLocaleDateString()}`}
            </p>
          </div>

          <div className="header-actions">
            <button className="btn-secondary" onClick={() => window.print()}>
              Export PDF
            </button>
            <button className="btn-primary" onClick={() => navigate("/dashboard")}>
              Dashboard
            </button>
            <button className="btn-primary" onClick={() => navigate("/practice")}>
              New Session
            </button>
          </div>
        </header>

        {/* METRICS */}
        <section className="metrics-grid">
          <div className="metric-card">
            <div className="metric-data">
              <h3>Overall Score</h3>
              <div className="metric-value">
                {avgScore.toFixed(1)}
                <span>/10</span>
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-data">
              <h3>Questions Answered</h3>
              <div className="metric-value">
                {totalQuestions}
              </div>
            </div>
          </div>

          {interviewData?.overallAnalysis?.overall_confidence_level && (
            <div className="metric-card">
              <div className="metric-data">
                <h3>Confidence Level</h3>
                <div className="metric-value" style={{ fontSize: '24px' }}>
                  {interviewData.overallAnalysis.overall_confidence_level}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* AI REPORT */}
        <section className="summary-section">
          <h2 className="section-title">AI Executive Summary</h2>
          <div className="summary-box">
            {report ? (
              <div className="markdown-report">
                <ReactMarkdown>{report}</ReactMarkdown>
              </div>
            ) : (
              <p className="empty-state">No summary generated.</p>
            )}
          </div>
        </section>

        {/* ANSWERS with Analysis */}
        <section className="detailed-review">
          <h2 className="section-title">Detailed Response Review</h2>
          <div className="qa-list">
            {answers.map((ans, idx) => (
              <article key={idx} className="qa-card">
                <div className="qa-header">
                  <span className="qa-number">Q{idx + 1}</span>
                  <h3 className="qa-question">{ans.question}</h3>
                  <div className="qa-badges">
                    {getScoreBadge(ans.content_score)}
                    {ans.confidence && (
                      <span className={`badge badge-${ans.confidence.toLowerCase()}`}>
                        {ans.confidence}
                      </span>
                    )}
                  </div>
                </div>

                <div className="qa-body">
                  {/* Transcript */}
                  <div className="transcript-box">
                    <span className="box-label">Candidate Transcript</span>
                    <p className="transcript-text">"{ans.answer || ans.transcript || "No answer provided"}"</p>
                  </div>

                  {/* Content Feedback */}
                  {ans.explanation && (
                    <div className="feedback-box">
                      <span className="box-label">
                        AI Assessment
                        {ans.confidence && ` (${ans.confidence})`}
                      </span>
                      <p className="feedback-text">{ans.explanation}</p>
                    </div>
                  )}

                  {/* ✅ NEW: Combined Analysis */}
                  {renderCombinedAnalysis(ans)}

                  {/* ✅ NEW: Facial Analysis */}
                  {renderFacialAnalysis(ans)}

                  {/* ✅ NEW: Speech Analysis */}
                  {renderSpeechAnalysis(ans)}

                  {/* Recommendations */}
                  {ans.recommendations && ans.recommendations.length > 0 && (
                    <div className="recommendations-box">
                      <span className="box-label">Recommendations</span>
                      <ul>
                        {ans.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </article>
            ))}

            {answers.length === 0 && (
              <div className="empty-state-box">No interview data found.</div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Results;