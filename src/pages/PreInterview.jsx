import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./PreInterview.css";

function PreInterview() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Grab data from location state with defaults.
  // Only the instant warm-up questions are known here; the AI-tailored ones are
  // still being generated in the background and are picked up on the Interview page.
  const {
    meetGreetQuestions = [],
    duration = 30,
    jobDescription = ""
  } = location.state || {};

  const estimatedAiCount = duration === 15 ? 5 : duration === 20 ? 7 : 10;
  const estimatedTotal = estimatedAiCount + meetGreetQuestions.length;

  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(false);

  useEffect(() => {
    let mediaStream = null;
    const initCamera = async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1280, height: 720 }, 
          audio: true 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setCameraError(false);
      } catch (err) {
        console.error("Camera access denied:", err.name, err.message);
        setCameraError(true);
      }
    };

    initCamera();

    // Cleanup: Stop tracks when leaving the page
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleStartInterview = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    navigate("/interview", {
      state: { meetGreetQuestions, duration, jobDescription }
    });
  };

  return (
    <div className="platform-page">
      <Header />
      
      <main className="pre-interview-container">
        {/* Stepper Navigation */}
        <nav className="stepper-nav">
          <ol className="stepper-list">
            <li className="stepper-item completed"><span className="stepper-text">1. Setup Role</span></li>
            <li className="stepper-separator">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7"></path>
                </svg>
            </li>
            <li className="stepper-item current"><span className="stepper-text">2. Equipment Check</span></li>
            <li className="stepper-separator">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7"></path>
                </svg>
            </li>
            <li className="stepper-item pending"><span className="stepper-text">3. Interview</span></li>
            <li className="stepper-separator">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7"></path>
                </svg>
            </li>
            <li className="stepper-item pending"><span className="stepper-text">4. Results</span></li>
          </ol>
        </nav>

        <div className="pre-interview-grid">
          
          {/* Left Column: Camera Test & Recovery UI */}
          <section className="hardware-check-section">
            <div className="hardware-card">
              <h2 className="card-title">Check your video and audio</h2>
              
              <div className="video-preview-box">
                {cameraError ? (
                  <div className="hardware-error-container">
                    <div className="error-icon-circle">
                      <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2zM3 3l18 18"></path>
                      </svg>
                    </div>
                    <h3>Camera Access Blocked</h3>
                    <p>We need your camera and microphone to simulate a real interview environment.</p>
                    
                    <div className="instructions-box">
                      <p><strong>How to fix:</strong></p>
                      <ol>
                        <li>Click the <strong>Lock (🔒)</strong> or <strong>Camera</strong> icon in the address bar.</li>
                        <li>Switch the Camera/Mic toggle to <strong>Allow</strong>.</li>
                        <li>Refresh this page.</li>
                      </ol>
                    </div>
                    
                    <button className="btn-retry" onClick={() => window.location.reload()}>
                      I've allowed access, Refresh
                    </button>
                  </div>
                ) : (
                  <>
                    <video ref={videoRef} autoPlay muted className="preview-video mirrored-video" />
                    <div className="mic-test-indicator">
                      <span className="pulsing-dot green"></span>
                      Microphone detected
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Right Column: Guidelines */}
          <section className="instructions-section">
            <div className="instructions-card">
              <h2 className="card-title">Ready to begin?</h2>
              <p className="subtitle">Your questions are ready. Keep these tips in mind:</p>
              
              <ul className="guidelines-list">
                <li>
                  <div className="icon-box blue-bg">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <div>
                    <strong>{duration} Minute Session</strong>
                    <p>
                      You'll start with a few quick warm-up questions, then answer
                      ~{estimatedTotal} questions tailored to your role.
                    </p>
                  </div>
                </li>
                <li>
                  <div className="icon-box purple-bg">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                  </div>
                  <div>
                    <strong>Environment Check</strong>
                    <p>Ensure you are in a quiet, well-lit room for best AI analysis.</p>
                  </div>
                </li>
              </ul>

              <div className="action-area">
                <button 
                  className="btn-join-interview" 
                  onClick={handleStartInterview}
                  disabled={cameraError}
                >
                  Join Interview 
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default PreInterview;