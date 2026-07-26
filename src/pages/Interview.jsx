// src/pages/Interview.jsx

import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";

import { 
  saveInterview, 
  processAnswer, 
  generateFeedback 
} from "../api/interviewApi";

import "./Interview.css";

function Interview() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    questions = [],
    duration = 30,
    jobDescription = ""
  } = location.state || {};

  const currentQuestions = questions.length
    ? questions
    : [
        "Tell me about yourself?",
        "Why do you want to work at our company?",
        "Describe a challenging project you worked on.",
        "How do you handle tight deadlines?",
        "What are your greatest strengths?"
      ];

  const [questionIndex, setQuestionIndex] = useState(1);
  const [answers, setAnswers] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [cameraError, setCameraError] = useState(false);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const videoPreviewRef = useRef(null);

  // CAMERA INIT
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        setVideoStream(stream);

        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }

        setCameraError(false);
      } catch (err) {
        console.error("Camera error:", err);
        setCameraError(true);
      }
    };

    initCamera();

    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // START RECORDING
  const startRecording = () => {
    if (!videoStream) return;

    chunksRef.current = [];

    const recorder = new MediaRecorder(videoStream, {
      mimeType: 'video/webm;codecs=vp8,opus'
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = uploadVideo;

    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setError(null);
  };

  // STOP RECORDING
  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // ============================================================
  // UPLOAD VIDEO - Using processAnswer API
  // ============================================================

  const uploadVideo = async () => {
    const blob = new Blob(chunksRef.current, { type: "video/webm" });
    const file = new File([blob], `answer_${questionIndex}.webm`, { type: "video/webm" });

    setIsProcessing(true);
    setError(null);

    try {
      const currentQuestion = currentQuestions[questionIndex - 1];

      const response = await processAnswer(
        jobDescription || "dummy_jd",
        currentQuestion,
        file,
        "",
        ""
      );

      const result = response.data;
      
      // 🔍 DEBUG: Log the full response
      console.log("📥 Full response from backend:", result);

      // ✅ Get data from the backend response
      const transcript = result.transcript || "";
      const contentScore = result.content_score || 5.0;
      const explanation = result.explanation || "Analysis completed.";
      const confidenceLevel = result.confidence_level || "Moderate";
      const combinedConfidence = result.combined_confidence || 0.5;
      const speechEmotion = result.speech_emotion || "neutral";
      
      // ✅ Get facial and speech analysis
      const facialAnalysis = result.facial_analysis || {};
      const speechAnalysis = result.speech_analysis || {};

      const answerData = {
        question: currentQuestion,
        answer: transcript,  // ✅ Use the actual transcript
        transcript: transcript,
        content_score: contentScore,
        confidence: confidenceLevel,
        explanation: explanation,
        combined_confidence: combinedConfidence,
        overall_emotion: speechEmotion,
        facial_analysis: facialAnalysis,
        speech_analysis: speechAnalysis,
        recommendations: result.recommendations || []
      };

      console.log("📝 Answer data saved:", answerData);

      const updatedAnswers = [...answers, answerData];
      setAnswers(updatedAnswers);

      // NEXT QUESTION
      if (questionIndex < currentQuestions.length) {
        setQuestionIndex(questionIndex + 1);
      } else {
        // FINISHED INTERVIEW - Generate feedback
        await handleGenerateFeedback(updatedAnswers);
      }

    } catch (error) {
      console.error("Upload error:", error);
      setError(error.response?.data?.message || "Error submitting answer. Please try again.");
      alert("Error submitting answer. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================================
  // GENERATE FINAL FEEDBACK
  // ============================================================

  const handleGenerateFeedback = async (allAnswers) => {
    setIsGeneratingFeedback(true);
    setError(null);

    try {
      const formattedAnswers = allAnswers.map(a => ({
        question: String(a.question || ""),
        answer: String(a.answer || a.transcript || ""),
        content_score: Number(a.content_score || 5.0),
        confidence: String(a.confidence || "Moderate"),
        explanation: String(a.explanation || "No explanation available"),
        combined_confidence: a.combined_confidence || 0.5,
        overall_emotion: a.overall_emotion || "neutral",
        facial_analysis: a.facial_analysis || {},
        speech_analysis: a.speech_analysis || {}
      }));

      const jdText = String(jobDescription || "dummy_jd");

      console.log("📤 Sending feedback request:", {
        jd: jdText,
        qa_list: formattedAnswers
      });

      const response = await generateFeedback(jdText, formattedAnswers);

      console.log("📥 Feedback response:", response.data);

      let report = "Feedback report generated successfully.";
      
      if (response.data) {
        if (typeof response.data === 'string') {
          report = response.data;
        } else if (response.data.report) {
          report = response.data.report;
        } else if (response.data.output) {
          report = response.data.output;
        }
      }

      await saveInterview({
        jobDescription: jdText,
        answers: formattedAnswers,
        report: report
      });

      navigate("/results", {
        state: {
          answers: formattedAnswers,
          report: report
        }
      });

    } catch (error) {
      console.error("❌ Feedback generation failed:", error);
      console.error("Error details:", error.response?.data);
      
      let errorMessage = "Error generating feedback. Please try again.";
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          if (Array.isArray(error.response.data.detail)) {
            errorMessage = error.response.data.detail.map(d => d.msg || d.message || JSON.stringify(d)).join(', ');
          } else {
            errorMessage = String(error.response.data.detail);
          }
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  // SKIP QUESTION
  const skipQuestion = () => {
    if (questionIndex < currentQuestions.length) {
      setQuestionIndex(questionIndex + 1);
    } else {
      handleGenerateFeedback(answers);
    }
  };

  return (
    <div className="platform-page">
      <Header />

      <main className="interview-container">
        {isGeneratingFeedback ? (
          <div className="feedback-loading-state">
            <div className="spinner"></div>
            <h2>Generating AI Feedback...</h2>
            <p>Please wait while we analyze your interview.</p>
          </div>
        ) : (
          <div className="interview-workspace">
            <section className="camera-section">
              <div className="session-header">
                <div>
                  Question {questionIndex} / {currentQuestions.length}
                </div>
              </div>

              <div className="camera-box">
                {cameraError ? (
                  <div className="camera-error">
                    <span>📷</span>
                    <p>Camera access denied. Please allow camera access and refresh.</p>
                  </div>
                ) : (
                  <video
                    ref={videoPreviewRef}
                    autoPlay
                    muted
                    className="video-preview mirrored-video"
                  />
                )}
              </div>

              {error && (
                <div className="error-message">
                  <span>❌</span> {error}
                  <button onClick={() => setError(null)}>×</button>
                </div>
              )}

              <div className="controls-bar">
                <button
                  className="btn-secondary"
                  onClick={skipQuestion}
                  disabled={isRecording || isProcessing}
                >
                  Skip Question
                </button>

                {!isRecording ? (
                  <button
                    className="btn-record-start"
                    onClick={startRecording}
                    disabled={isProcessing || cameraError}
                  >
                    {isProcessing ? "Processing..." : "Start Answering"}
                  </button>
                ) : (
                  <button
                    className="btn-record-stop"
                    onClick={stopRecording}
                  >
                    Finish Answer
                  </button>
                )}
              </div>
            </section>

            <section className="question-section">
              <div className="active-question-card">
                <h4>Current Question</h4>
                <h2>{currentQuestions[questionIndex - 1]}</h2>
              </div>

              {answers.length > 0 && (
                <div className="answers-preview">
                  <h4>Completed Answers ({answers.length})</h4>
                  <div className="preview-list">
                    {answers.map((a, i) => (
                      <div key={i} className="preview-item">
                        <span className="q-number">Q{i + 1}</span>
                        <span className="q-score">Score: {a.content_score?.toFixed(1) || 0}/10</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default Interview;