import React, { useState, useEffect } from "react";
import {useNavigate} from "react-router-dom"
const TextGenerateEffect = ({ words, className = "", duration = 0.5 }) => {
  const [visibleWords, setVisibleWords] = useState([]);
  const wordsArray = words.split(" ");

  useEffect(() => {
    // Reset animation when words change
    setVisibleWords([]);
    
    // Animate words one by one
    wordsArray.forEach((_, index) => {
      setTimeout(() => {
        setVisibleWords(prev => [...prev, index]);
      }, index * 200); // 0.2s delay between words
    });
  }, [words]);

  const wordStyle = (index) => ({
    display: "inline-block",
    marginRight: "0.25em",
    opacity: visibleWords.includes(index) ? 1 : 0,
    filter: visibleWords.includes(index) ? "blur(0px)" : "blur(10px)",
    transition: `opacity ${duration}s ease, filter ${duration}s ease`
  });

  return (
    <div className={`fw-bold ${className}`}>
      <div className="mt-4">
        <div className="text-white fs-2 lh-base">
          {wordsArray.map((word, idx) => (
            <span
              key={word + idx}
              style={wordStyle(idx)}
            >
              {word}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

function AppIntro() {
  const [word, setWord] = useState("Welcome to SanketMeet Connect, collaborate, and chat in real time Your next-generation video conferencing and chat platform.");
  const navigate=useNavigate();
  const handleGetStarted = () => {
    navigate("/landingpage")
    console.log("Get Started clicked");
  };

  return (
    <>
      <style>
        {`
          .video-container {
            position: relative;
            width: 100%;
            min-height: 100vh;
            overflow: hidden;
          }
          
          .video-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.4);
            z-index: 2;
          }
          
          .background-video {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            filter: brightness(0.5);
            z-index: 1;
          }
          
          .content-wrapper {
            position: relative;
            z-index: 3;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 2rem;
          }
          
          .main-title {
            background: linear-gradient(135deg, #ffffff, #e3e3e3);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          }
          
          .brand-highlight {
            background: linear-gradient(135deg, #007bff, #0056b3);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          .get-started-btn {
            background: linear-gradient(135deg, #007bff, #0056b3);
            border: none;
            border-radius: 50px;
            box-shadow: 0 8px 25px rgba(0, 123, 255, 0.3);
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
            color: white;
            position: relative;
            overflow: hidden;
          }
          
          .get-started-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s ease;
          }
          
          .get-started-btn:hover::before {
            left: 100%;
          }
          
          .get-started-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 35px rgba(0, 123, 255, 0.4);
            color: white;
            text-decoration: none;
          }
          
          .get-started-btn:active {
            transform: translateY(-1px);
          }
          
          .text-animate-container {
            max-width: 800px;
            margin: 0 auto;
          }
          
          @media (max-width: 768px) {
            .main-title {
              font-size: 2.5rem !important;
            }
            
            .text-white.fs-2 {
              font-size: 1.25rem !important;
            }
            
            .get-started-btn {
              font-size: 1.1rem !important;
              padding: 12px 30px !important;
            }
            
            .content-wrapper {
              padding: 1rem;
            }
          }
          
          @media (max-width: 576px) {
            .main-title {
              font-size: 2rem !important;
            }
            
            .text-white.fs-2 {
              font-size: 1.1rem !important;
            }
          }
        `}
      </style>
      
      <div 
        className="container-fluid position-relative d-flex align-items-center justify-content-center p-0 video-container"
        style={{ minHeight: "100vh", background: "#181c20" }}
      >
        
        {/* Content */}
        <div className="content-wrapper">
          <div className="text-center text-white w-100">
            <h1 className="display-3 mb-4 fw-bold main-title">
              Welcome to <span className="brand-highlight">SanketMeet</span>
            </h1>
            
            <div className="text-animate-container">
              <TextGenerateEffect
                words="Connect, collaborate, and chat in real time. Your next-generation video conferencing and chat platform."
                className="mb-4"
                duration={0.5}
              />
            </div>
            
            <button 
              onClick={handleGetStarted}
              className="btn btn-lg px-5 py-3 fw-bold fs-4 get-started-btn"
            >
              Get Started
              <span className="ms-2">→</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default AppIntro;