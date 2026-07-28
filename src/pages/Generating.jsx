import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./Generating.css";

function Generating() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Destructure state passed from Setup.
  // The AI questions are being generated in the BACKGROUND (see
  // services/questionGeneration.js); here we only carry the instant warm-up
  // questions forward. This page is now just a short, friendly transition.
  const {
    meetGreetQuestions = [],
    duration = 30,
    jobDescription = ""
  } = location.state || {};

  // Rough estimate of how many tailored questions the AI will produce, purely
  // for display (matches the backend duration -> count mapping).
  const estimatedAiCount = duration === 15 ? 5 : duration === 20 ? 7 : 10;

  const [progress, setProgress] = useState(0);


  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);

          navigate("/pre-interview", {
            state: { meetGreetQuestions, duration, jobDescription }
          });
          return 100;
        }

        return prev + 5;
      });
    }, 90); // ~1.8s: just a smooth hand-off, not a real wait anymore

    return () => clearInterval(interval);
  }, [navigate, meetGreetQuestions, duration, jobDescription]);

  // Dynamic loading text based on progress
  let loadingText = "Setting up your warm-up questions...";
  if (progress > 35) loadingText = "Your tailored questions are being prepared in the background...";
  if (progress > 75) loadingText = "Configuring interview environment...";

  return (
    <div className="platform-page">
      <Header />
      
      <main className="generating-container">
        {/* Modern Stepper Navigation */}
        <nav className="stepper-nav" aria-label="Progress">
          <ol className="stepper-list">
            <li className="stepper-item completed">
              <span className="stepper-text">1. Overview</span>
            </li>
            <li className="stepper-separator">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
            </li>
            <li className="stepper-item completed">
              <span className="stepper-text">2. Setup Role</span>
            </li>
            <li className="stepper-separator">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
            </li>
            {/* Updated Stepper to show Equipment Check next */}
            <li className="stepper-item current" aria-current="step">
              <span className="stepper-text">3. Equipment Check</span>
            </li>
            <li className="stepper-separator">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
            </li>
            <li className="stepper-item pending">
              <span className="stepper-text">4. Interview</span>
            </li>
          </ol>
        </nav>

        {/* Loading UI Centerpiece */}
        <section className="loader-section">
          <div className="loader-card">
            
            {/* Animated AI Icon */}
            <div className="icon-pulse-wrapper">
              <div className="pulse-ring"></div>
              <div className="ai-icon-box">
                <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </div>
            </div>

            <h2 className="loader-title">MockHire is preparing your session</h2>
            <p className="loader-subtitle">{loadingText}</p>

            {/* Gradient Progress Bar */}
            <div className="progress-track">
              <div 
                className="progress-fill-gradient" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            {/* Session Info Badges */}
            <div className="session-badges">
              <div className="badge badge-blue">
                <span className="dot dot-blue"></span>
                {duration} Minutes
              </div>
              <div className="badge badge-purple">
                <span className="dot dot-purple"></span>
                ~{estimatedAiCount + meetGreetQuestions.length} Questions
              </div>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Generating;