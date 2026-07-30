// src/pages/Interview.jsx
//
// Interview flow with two big UX improvements:
//
// 1) INSTANT START (no "wall"):
//    The candidate immediately answers a few pre-built "meet & greet" warm-up
//    questions (fetched from MongoDB) while the real, job-specific AI questions
//    are generated in the BACKGROUND. When the AI questions are ready the UI
//    seamlessly switches over to them. If the candidate somehow finishes the
//    warm-ups before the AI is done, a short "preparing" screen is shown.
//
// 2) ASYNC ANALYSIS (no waiting between questions):
//    When the candidate submits an answer, the 3 heavy steps
//      (a) LLM content evaluation, (b) speech analysis, (c) facial analysis
//    run in the BACKGROUND. The candidate advances to the next question
//    instantly. Every result is kept in memory (resultsRef), keyed by question
//    index. After the final answer, we collect ALL background results and only
//    then generate the final summary (with a dedicated loading screen).

import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";

import {
  saveInterview,
  processAnswer,
  generateFeedback
} from "../api/interviewApi";
import { getQuestionGenerationPromise } from "../services/questionGeneration";

import "./Interview.css";

// If AI generation totally fails we still want a usable interview.
const FALLBACK_AI_QUESTIONS = [
  "Tell me about a challenging project you worked on and how you approached it.",
  "What technical skills make you a strong fit for this role?",
  "Describe a time you had to learn something new quickly.",
  "How do you handle tight deadlines or competing priorities?",
  "Where do you see the biggest opportunity to add value in this role?"
];

function Interview() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    meetGreetQuestions = [],
    duration = 30,
    jobDescription = ""
  } = location.state || {};

  // Warm-up questions are known up-front (fall back to a tiny built-in set).
  const warmupQuestions = useMemo(() => {
    if (meetGreetQuestions && meetGreetQuestions.length) return meetGreetQuestions;
    return ["To get us started, please give a brief introduction about yourself."];
  }, [meetGreetQuestions]);
  const warmupCount = warmupQuestions.length;

  // AI (tailored) questions arrive asynchronously from the background job.
  const [aiQuestions, setAiQuestions] = useState(null); // null = still loading
  const aiQuestionsRef = useRef(null); // fresh copy for event-handler logic
  const [aiError, setAiError] = useState(false);

  // The full ordered list once AI questions are in.
  const allQuestions = useMemo(
    () => [...warmupQuestions, ...(aiQuestions || [])],
    [warmupQuestions, aiQuestions]
  );

  // phase: "answering" (has a question to answer)
  //      | "waiting-ai" (finished warm-ups, AI questions not ready yet)
  //      | "summarizing" (all done, generating final report)
  const [phase, setPhase] = useState("answering");
  const [questionIndex, setQuestionIndex] = useState(0); // 0-based

  const [isRecording, setIsRecording] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [cameraError, setCameraError] = useState(false);
  const [error, setError] = useState(null);

  // Live view of submitted answers + their background-analysis status.
  const [answerMeta, setAnswerMeta] = useState([]); // [{index, question, status, score}]

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const videoPreviewRef = useRef(null);

  // In-memory, structured store of background analysis results.
  const resultsRef = useRef({}); // index -> answerData
  const pendingRef = useRef([]); // [{index, question, promise}]
  const activeAnswerRef = useRef({ index: 0, question: "" });
  const finishedRef = useRef(false); // guard against double-finish

  const isWarmup = questionIndex < warmupCount;
  const analyzingCount = answerMeta.filter((a) => a.status === "analyzing").length;

  // ============================================================
  // BACKGROUND: pick up the AI question generation job
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    getQuestionGenerationPromise(jobDescription, duration)
      .then((questions) => {
        if (cancelled) return;
        aiQuestionsRef.current = questions;
        setAiQuestions(questions);
      })
      .catch((err) => {
        console.error("AI question generation failed, using fallback set.", err);
        if (cancelled) return;
        aiQuestionsRef.current = FALLBACK_AI_QUESTIONS;
        setAiQuestions(FALLBACK_AI_QUESTIONS);
        setAiError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [jobDescription, duration]);

  // When the candidate is parked on the "waiting-ai" screen and the AI
  // questions arrive, move straight into the first tailored question.
  useEffect(() => {
    if (phase === "waiting-ai" && aiQuestions && aiQuestions.length > 0) {
      setQuestionIndex(warmupCount);
      setPhase("answering");
    }
  }, [phase, aiQuestions, warmupCount]);

  // ============================================================
  // CAMERA INIT
  // ============================================================
  useEffect(() => {
    let stream = null;
    const initCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
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
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
    }
  };

  // ============================================================
  // RECORDING
  // ============================================================
  const startRecording = () => {
    if (!videoStream) return;

    // Snapshot which question this recording belongs to (robust against the
    // index advancing while analysis runs in the background).
    activeAnswerRef.current = {
      index: questionIndex,
      question: allQuestions[questionIndex]
    };

    chunksRef.current = [];

    const recorder = new MediaRecorder(videoStream, {
      mimeType: "video/webm;codecs=vp8,opus"
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = handleRecordingStopped;

    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setError(null);
  };

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
  // ON SUBMIT: fire analysis in background, advance IMMEDIATELY
  // ============================================================
  const handleRecordingStopped = () => {
    const { index, question } = activeAnswerRef.current;

    // Build the file synchronously from the captured chunks.
    const blob = new Blob(chunksRef.current, { type: "video/webm" });
    const file = new File([blob], `answer_${index + 1}.webm`, {
      type: "video/webm"
    });

    // Track it in the live UI list as "analyzing".
    setAnswerMeta((prev) => [
      ...prev,
      { index, question, status: "analyzing", score: null }
    ]);

    // Kick off the 3-step analysis in the BACKGROUND (not awaited).
    const promise = analyzeAnswerInBackground(index, question, file);
    pendingRef.current.push({ index, question, promise });

    // Advance to the next question right away.
    goToNext(index);
  };

  // Runs the heavy analysis and stores the structured result in memory.
  const analyzeAnswerInBackground = async (index, question, file) => {
    try {
      const response = await processAnswer(
        jobDescription || "dummy_jd",
        question,
        file,
        "",
        ""
      );
      const result = response.data || {};
      const answerData = mapResultToAnswer(question, result);
      resultsRef.current[index] = answerData;

      setAnswerMeta((prev) =>
        prev.map((a) =>
          a.index === index
            ? { ...a, status: "done", score: answerData.content_score }
            : a
        )
      );
      return answerData;
    } catch (err) {
      console.error(`Background analysis failed for Q${index + 1}:`, err);
      const answerData = fallbackAnswer(question);
      resultsRef.current[index] = answerData;

      setAnswerMeta((prev) =>
        prev.map((a) =>
          a.index === index ? { ...a, status: "error", score: 0 } : a
        )
      );
      return answerData;
    }
  };

  const mapResultToAnswer = (question, result) => {
    return {
      question,
      answer: result.transcript || "",
      transcript: result.transcript || "",
      content_score: result.content_score ?? 5.0,
      confidence: result.confidence_level || "Moderate",
      explanation: result.explanation || "Analysis completed.",
      combined_confidence: result.combined_confidence ?? 0.5,
      overall_emotion: result.speech_emotion || "neutral",
      facial_analysis: result.facial_analysis || {},
      speech_analysis: result.speech_analysis || {},
      recommendations: result.recommendations || []
    };
  };

  const fallbackAnswer = (question) => ({
    question,
    answer: "",
    transcript: "",
    content_score: 0,
    confidence: "Unknown",
    explanation: "This answer could not be analyzed automatically.",
    combined_confidence: 0,
    overall_emotion: "neutral",
    facial_analysis: {},
    speech_analysis: {},
    recommendations: []
  });

  // ============================================================
  // NAVIGATION BETWEEN QUESTIONS
  // ============================================================
  const goToNext = (index) => {
    const next = index + 1;

    // Still inside the warm-up block.
    if (next < warmupCount) {
      setQuestionIndex(next);
      setPhase("answering");
      return;
    }

    // Finished all warm-ups. Are the AI questions ready?
    const ai = aiQuestionsRef.current;
    if (!ai) {
      // Not yet — park on the "preparing" screen; an effect resumes us.
      setPhase("waiting-ai");
      return;
    }

    const total = warmupCount + ai.length;
    if (next < total) {
      setQuestionIndex(next);
      setPhase("answering");
    } else {
      finishInterview();
    }
  };

  const skipQuestion = () => {
    // Skipping simply advances; no analysis is recorded for this question.
    goToNext(questionIndex);
  };

  // ============================================================
  // FINISH: collect all background results, then summarize
  // ============================================================
  const finishInterview = async () => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    setPhase("summarizing");
    setError(null);

    // Wait for every background analysis to settle.
    await Promise.allSettled(pendingRef.current.map((p) => p.promise));

    // Assemble the answers in question order from the in-memory store.
    const orderedAnswers = pendingRef.current
      .slice()
      .sort((a, b) => a.index - b.index)
      .map((p) => resultsRef.current[p.index])
      .filter(Boolean);

    await handleGenerateFeedback(orderedAnswers);
  };

  const handleGenerateFeedback = async (allAnswers) => {
    try {
      const formattedAnswers = allAnswers.map((a) => ({
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

      // Resolve the candidate name from the stored user (supports both
      // { name } and nested { user: { name } } shapes). Position and company
      // are left to the backend to infer from the job description.
      let candidateName = "";
      try {
        const parsed = JSON.parse(localStorage.getItem("user") || "{}");
        const userObj = parsed.user || parsed;
        candidateName = userObj.name || "";
      } catch (e) {
        candidateName = "";
      }

      let report = "Feedback report generated successfully.";
      if (formattedAnswers.length > 0) {
        const response = await generateFeedback(jdText, formattedAnswers, {
          candidate: candidateName
        });
        if (response.data) {
          if (typeof response.data === "string") report = response.data;
          else if (response.data.report) report = response.data.report;
          else if (response.data.output) report = response.data.output;
        }

        await saveInterview({
          jobDescription: jdText,
          answers: formattedAnswers,
          report: report
        });
      } else {
        report = "No answers were submitted, so no report could be generated.";
      }

      stopCamera();
      navigate("/results", {
        state: { answers: formattedAnswers, report: report }
      });
    } catch (error) {
      console.error("Feedback generation failed:", error);
      let errorMessage = "Error generating feedback. Please try again.";
      if (error.response?.data) {
        if (typeof error.response.data === "string") {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = Array.isArray(error.response.data.detail)
            ? error.response.data.detail
                .map((d) => d.msg || d.message || JSON.stringify(d))
                .join(", ")
            : String(error.response.data.detail);
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
      // Allow another attempt at finishing.
      finishedRef.current = false;
      setPhase("answering");
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  // Final summary is generating — dedicated loading screen.
  if (phase === "summarizing") {
    return (
      <div className="platform-page">
        <Header />
        <main className="interview-container">
          <div className="feedback-loading-state">
            <div className="spinner"></div>
            <h2>Generating your AI feedback report...</h2>
            <p>
              We're combining your content, speech and facial analysis into a
              full report. This can take a little while — please hang tight.
            </p>
            {analyzingCount > 0 && (
              <p className="muted">
                Finalizing {analyzingCount} answer
                {analyzingCount > 1 ? "s" : ""} still being analyzed...
              </p>
            )}
            {error && (
              <div className="error-message">
                <span>❌</span> {error}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Warm-ups done but tailored questions aren't ready yet.
  if (phase === "waiting-ai") {
    return (
      <div className="platform-page">
        <Header />
        <main className="interview-container">
          <div className="feedback-loading-state">
            <div className="spinner"></div>
            <h2>Preparing your tailored questions...</h2>
            <p>
              Great job on the warm-up! Your personalized interview questions are
              almost ready.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const currentQuestion = allQuestions[questionIndex] || "";
  const counterLabel = aiQuestions
    ? `Question ${questionIndex + 1} / ${allQuestions.length}`
    : `Warm-up ${questionIndex + 1} / ${warmupCount}`;

  return (
    <div className="platform-page">
      <Header />

      <main className="interview-container">
        <div className="interview-workspace">
          <section className="camera-section">
            <div className="session-header">
              <div>
                {counterLabel}
                <span className={`phase-chip ${isWarmup ? "warmup" : "main"}`}>
                  {isWarmup ? "Warm-up" : "Interview"}
                </span>
              </div>
              {analyzingCount > 0 && (
                <div className="bg-analyzing">
                  🔄 {analyzingCount} answer{analyzingCount > 1 ? "s" : ""}{" "}
                  analyzing in background
                </div>
              )}
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

            {aiError && (
              <div className="info-banner">
                Tailored questions couldn't be generated, so we're using a
                standard question set.
              </div>
            )}

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
                disabled={isRecording}
              >
                Skip Question
              </button>

              {!isRecording ? (
                <button
                  className="btn-record-start"
                  onClick={startRecording}
                  disabled={cameraError}
                >
                  Start Answering
                </button>
              ) : (
                <button className="btn-record-stop" onClick={stopRecording}>
                  Finish Answer
                </button>
              )}
            </div>
          </section>

          <section className="question-section">
            <div className="active-question-card">
              <h4>{isWarmup ? "Warm-up Question" : "Current Question"}</h4>
              <h2>{currentQuestion}</h2>
            </div>

            {answerMeta.length > 0 && (
              <div className="answers-preview">
                <h4>Submitted Answers ({answerMeta.length})</h4>
                <div className="preview-list">
                  {answerMeta.map((a) => (
                    <div key={a.index} className="preview-item">
                      <span className="q-number">Q{a.index + 1}</span>
                      {a.status === "analyzing" && (
                        <span className="q-score analyzing">Analyzing…</span>
                      )}
                      {a.status === "done" && (
                        <span className="q-score">
                          Score: {Number(a.score ?? 0).toFixed(1)}/10
                        </span>
                      )}
                      {a.status === "error" && (
                        <span className="q-score error">Failed</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Interview;
