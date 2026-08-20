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

  // 'report' | 'qa'
  const [activeTab, setActiveTab] = useState("report");

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

  const getConfidenceColor = (level) => {
    const colors = {
      'Excellent': '#10b981',
      'High': '#22c55e',
      'Moderate': '#f59e0b',
      'Fair': '#ea580c',
      'Low': '#ef4444',
      'Unknown': '#64748b'
    };
    return colors[level] || '#64748b';
  };

  const getFormattedPercent = (val) => {
    if (val === undefined || val === null) return 0;
    const num = Number(val);
    const pct = num > 1 ? num : num * 100;
    return pct;
  };

  const answers = interviewData?.answers || locationAnswers || [];
  const report = interviewData?.report || locationReport || "";
  const totalQuestions = answers.length;
  const avgScore = totalQuestions > 0
    ? answers.reduce((acc, curr) => acc + Number(curr.content_score || 0), 0) / totalQuestions
    : 0;

  // Calculate Overall Facial Confidence Percentage (filter out failed/skipped analysis where frames_analyzed is 0 or undefined)
  const answersWithFacial = answers.filter(a => 
    a.facial_analysis && 
    (typeof a.facial_analysis.confidence === 'number' || typeof a.facial_analysis.confidence_score === 'number') &&
    a.facial_analysis.frames_analyzed > 0
  );
  const avgFacialConfidence = answersWithFacial.length > 0
    ? (answersWithFacial.reduce((sum, a) => {
        const conf = (a.facial_analysis.confidence !== undefined && a.facial_analysis.confidence > 0) ? a.facial_analysis.confidence : (a.facial_analysis.confidence_score || 0);
        return sum + conf;
      }, 0) / answersWithFacial.length) * 100
    : null;

  
  const answersWithSpeech = answers.filter(a => 
    a.speech_analysis && 
    typeof a.speech_analysis.confidence_score === 'number' &&
    a.speech_analysis.predicted_emotion !== 'unknown' &&
    a.speech_analysis.confidence_score > 0
  );
  const avgSpeechConfidence = answersWithSpeech.length > 0
    ? (answersWithSpeech.reduce((sum, a) => sum + a.speech_analysis.confidence_score, 0) / answersWithSpeech.length) * 100
    : null;
  const renderFacialAnalysis = (ans) => {
    if (!ans.facial_analysis) return null;
    const fa = ans.facial_analysis;
    const confidenceVal = (fa.confidence !== undefined && fa.confidence > 0) ? fa.confidence : (fa.confidence_score || 0);
    if (confidenceVal === undefined || confidenceVal === null) return null;

    const emotions = fa.emotional_states || {};

    return (
      <div className="analysis-section facial-analysis">
        <h4>😊 Facial Expression Analysis</h4>
        <div className="analysis-grid">
          <div className="analysis-item">
            <span className="label">Confidence Score</span>
            <span className="value">{(confidenceVal * 100).toFixed(1)}%</span>
          </div>
          <div className="analysis-item">
            <span className="label">Level</span>
            <span className={`value level-${fa.confidence_level?.toLowerCase() || 'unknown'}`}>
              {fa.confidence_level || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Emotion Distribution */}
        {Object.keys(emotions).length > 0 && (
          <div className="emotion-bars">
            <span className="box-label">Detected Emotions</span>
            <div className="emotion-bar">
              <span className="emotion-label">Confident</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${getFormattedPercent(emotions.confident)}%`, backgroundColor: '#10b981' }} />
              </div>
              <span className="emotion-value">{getFormattedPercent(emotions.confident).toFixed(1)}%</span>
            </div>
            <div className="emotion-bar">
              <span className="emotion-label">Neutral</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${getFormattedPercent(emotions.neutral)}%`, backgroundColor: '#64748b' }} />
              </div>
              <span className="emotion-value">{getFormattedPercent(emotions.neutral).toFixed(1)}%</span>
            </div>
            <div className="emotion-bar">
              <span className="emotion-label">Nervous</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${getFormattedPercent(emotions.nervous)}%`, backgroundColor: '#ef4444' }} />
              </div>
              <span className="emotion-value">{getFormattedPercent(emotions.nervous).toFixed(1)}%</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSpeechAnalysis = (ans) => {
    if (!ans.speech_analysis || !ans.speech_analysis.confidence_score) return null;

    const sa = ans.speech_analysis;
    const scores = sa.emotion_scores || {};

    return (
      <div className="analysis-section speech-analysis">
        <h4>🎤 Speech Analysis</h4>
        <div className="analysis-grid">
          <div className="analysis-item">
            <span className="label">Confidence</span>
            <span className="value">{(sa.confidence_score * 100).toFixed(1)}%</span>
          </div>
          <div className="analysis-item">
            <span className="label">Vocal Emotion</span>
            <span className={`value emotion-${sa.predicted_emotion?.toLowerCase() || 'unknown'}`}>
              {sa.predicted_emotion || 'Unknown'}
            </span>
          </div>
        </div>

        {Object.keys(scores).length > 0 && (
          <div className="emotion-bars">
            <span className="box-label">Vocal Tone Mix</span>
            <div className="emotion-bar">
              <span className="emotion-label">Confident</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${getFormattedPercent(scores.confident)}%`, backgroundColor: '#10b981' }} />
              </div>
              <span className="emotion-value">{getFormattedPercent(scores.confident).toFixed(1)}%</span>
            </div>
            <div className="emotion-bar">
              <span className="emotion-label">Clear</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${getFormattedPercent(scores.clear)}%`, backgroundColor: '#3b82f6' }} />
              </div>
              <span className="emotion-value">{getFormattedPercent(scores.clear).toFixed(1)}%</span>
            </div>
            <div className="emotion-bar">
              <span className="emotion-label">Nervous</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${getFormattedPercent(scores.nervous)}%`, backgroundColor: '#ef4444' }} />
              </div>
              <span className="emotion-value">{getFormattedPercent(scores.nervous).toFixed(1)}%</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="platform-results-page">
        <Header />
        <main className="platform-container">
          <div className="loading-state-box">
            <div className="spinner"></div>
            <p>Analyzing responses and building your feedback report...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="platform-results-page">
      <Header />

      <main className="platform-container">
        {/* HEADER SECTION */}
        <section className="report-header">
          <div>
            <h1 className="report-title">{interviewData?.jobTitle || "Interview Practice"} Report</h1>
            <p className="report-subtitle">
              Generated on {interviewData?.createdAt ? new Date(interviewData.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
            </p>
          </div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={handlePrint}>
              <span>🖨️</span> Save as PDF / Print
            </button>
            <button className="btn-primary" onClick={() => navigate("/dashboard")}>
              Return to Dashboard
            </button>
          </div>
        </section>

        {/* METRICS HEADER DASHBOARD */}
        <section className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon blue-bg">
              <img src="https://img.icons8.com/fluency/96/trophy.png" alt="Overall Score" />
            </div>
            <div className="metric-data">
              <h3>Evaluation Score</h3>
              <div className="metric-value">
                {avgScore.toFixed(1)}
                <span>/10</span>
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon purple-bg">
              <img src="https://img.icons8.com/fluency/96/help.png" alt="Questions" />
            </div>
            <div className="metric-data">
              <h3>Questions Answered</h3>
              <div className="metric-value">{totalQuestions}</div>
            </div>
          </div>

          {avgFacialConfidence !== null && (
            <div className="metric-card">
              <div className="metric-icon green-bg">
                <img src="https://img.icons8.com/fluency/96/happy.png" alt="Facial Confidence" />
              </div>
              <div className="metric-data">
                <h3>Facial Confidence</h3>
                <div className="metric-value">
                  {avgFacialConfidence.toFixed(1)}
                  <span>%</span>
                </div>
              </div>
            </div>
          )}

          {avgSpeechConfidence !== null && (
            <div className="metric-card">
              <div className="metric-icon orange-bg">
                <img src="https://img.icons8.com/fluency/96/microphone.png" alt="Speech Confidence" />
              </div>
              <div className="metric-data">
                <h3>Speech Confidence</h3>
                <div className="metric-value">
                  {avgSpeechConfidence.toFixed(1)}
                  <span>%</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* TABS NAVIGATION */}
        <div className="results-tab-bar">
          <button 
            className={`tab-link ${activeTab === "report" ? "active" : ""}`}
            onClick={() => setActiveTab("report")}
          >
          Feedback Report
          </button>
          <button 
            className={`tab-link ${activeTab === "qa" ? "active" : ""}`}
            onClick={() => setActiveTab("qa")}
          >
          Detailed Response Review
          </button>
        </div>

        {/* TAB CONTENT 1: AI REPORT */}
        {activeTab === "report" && (
          <div className="tab-pane active fade-in">
            {report ? (
              <div className="summary-box">
                <div className="markdown-report">
                  <ReactMarkdown>{report}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="empty-state-box">
                <p>No feedback report was generated for this session.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT 2: DETAILED Q&A REVIEW */}
        {activeTab === "qa" && (
          <div className="tab-pane active fade-in">
            <div className="qa-list">
              {answers.length > 0 ? (
                answers.map((ans, idx) => (
                  <div key={idx} className="qa-card">
                    <div className="qa-header">
                      <span className="qa-number">Q{idx + 1}</span>
                      <h3 className="qa-question">{ans.question}</h3>
                      <div className="qa-score-badge">
                        {getScoreBadge(ans.content_score)}
                      </div>
                    </div>

                    <div className="qa-body">
                      {/* Answer Transcript */}
                      <div className="feedback-box">
                        <span className="box-label">Your Transcript</span>
                        <div className="transcript-box">
                          <p className="transcript-text">
                            "{ans.answer || ans.transcript || "No transcript recorded for this response."}"
                          </p>
                        </div>
                      </div>

                      {/* Content evaluation explanation */}
                      {ans.explanation && (
                        <div className="feedback-box">
                          <span className="box-label">Evaluation Feedback</span>
                          <p className="feedback-text">{ans.explanation}</p>
                        </div>
                      )}

                      {/* Facial Analysis */}
                      {renderFacialAnalysis(ans)}

                      {/* Speech Analysis */}
                      {renderSpeechAnalysis(ans)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state-box">
                  <p>No individual question records are available for this interview.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default Results;