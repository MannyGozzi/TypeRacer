"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface TypeRacerProps {
  text?: string;
  onComplete?: (stats: { wpm: number; accuracy: number; time: number }) => void;
}

export default function TypeRacer({ 
  text = "The quick brown fox jumps over the lazy dog. This is a sample text for typing practice.",
  onComplete 
}: TypeRacerProps) {
  const [currentText] = useState(text);
  const [userInput, setUserInput] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [errors, setErrors] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const progress = (currentIndex / currentText.length) * 100;

  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };
    
    // Focus immediately
    focusInput();
    
    // Also focus when clicking anywhere on the page
    const handlePageClick = () => {
      if (!isComplete) {
        focusInput();
      }
    };
    
    document.addEventListener('click', handlePageClick);
    document.addEventListener('keydown', focusInput);
    
    return () => {
      document.removeEventListener('click', handlePageClick);
      document.removeEventListener('keydown', focusInput);
    };
  }, [isComplete]);

  useEffect(() => {
    if (userInput.length === 1 && startTime === null) {
      setStartTime(Date.now());
    }
  }, [userInput, startTime]);

  useEffect(() => {
    if (currentIndex >= currentText.length && !isComplete) {
      const endTime = Date.now();
      const timeInMinutes = startTime ? (endTime - startTime) / 60000 : 0;
      const wordsTyped = currentText.split(' ').length;
      const calculatedWpm = timeInMinutes > 0 ? Math.round(wordsTyped / timeInMinutes) : 0;
      const calculatedAccuracy = Math.round(((currentText.length - errors) / currentText.length) * 100);
      
      setWpm(calculatedWpm);
      setAccuracy(calculatedAccuracy);
      setIsComplete(true);
      
      if (onComplete) {
        onComplete({
          wpm: calculatedWpm,
          accuracy: calculatedAccuracy,
          time: timeInMinutes
        });
      }
    }
  }, [currentIndex, currentText, isComplete, startTime, errors, onComplete]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (isComplete) return;
    
    setUserInput(value);
    
    let newIndex = 0;
    let newErrors = 0;
    
    for (let i = 0; i < value.length && i < currentText.length; i++) {
      if (value[i] === currentText[i]) {
        newIndex = i + 1;
      } else {
        newErrors++;
      }
    }
    
    setCurrentIndex(newIndex);
    setErrors(newErrors);
    
    const currentAccuracy = value.length > 0 ? Math.round(((value.length - newErrors) / value.length) * 100) : 100;
    setAccuracy(currentAccuracy);
  };

  const resetRace = () => {
    setUserInput("");
    setCurrentIndex(0);
    setStartTime(null);
    setIsComplete(false);
    setWpm(0);
    setAccuracy(100);
    setErrors(0);
    
    // Focus after a brief delay to ensure state has updated
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const renderText = () => {
    return currentText.split('').map((char, index) => {
      let className = "text-gray-500";
      let displayChar = char;
      
      if (index < userInput.length) {
        if (userInput[index] === char) {
          className = "text-white";
          displayChar = userInput[index];
        } else {
          className = "text-red-400 bg-red-900/30";
          displayChar = userInput[index];
        }
      } else if (index === userInput.length) {
        className = "text-gray-500 bg-white/20 animate-pulse";
      }
      
      return (
        <span key={index} className={`${className} transition-all duration-150 relative`}>
          {displayChar}
        </span>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with stats */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-8 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">{wpm}</div>
              <div className="text-sm text-gray-400">WPM</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{accuracy}%</div>
              <div className="text-sm text-gray-400">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{Math.round(progress)}%</div>
              <div className="text-sm text-gray-400">Progress</div>
            </div>
          </div>
          
          <div className="w-full bg-gray-800 rounded-full h-2 mb-8">
            <div 
              className="bg-yellow-400 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Main typing area */}
        <div 
          className="bg-gray-800 rounded-lg p-8 mb-8 cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          <div className="text-center mb-4">
            <span className="text-gray-400 text-sm">english</span>
          </div>
          
          <div className="text-2xl leading-relaxed font-mono tracking-wide text-center max-w-4xl mx-auto break-words">
            {renderText()}
          </div>
        </div>

        {/* Hidden input for capturing keystrokes */}
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={handleInputChange}
          disabled={isComplete}
          className="opacity-0 absolute top-0 left-0 w-1 h-1 pointer-events-none"
          autoFocus
          style={{ 
            position: 'fixed', 
            top: '-9999px', 
            left: '-9999px',
            zIndex: -1
          }}
        />
        
        {/* Controls */}
        <div className="text-center space-y-4">
          <div className="text-gray-400 text-sm">
            {isComplete ? "Race completed!" : "Click anywhere or start typing to begin..."}
          </div>
          
          <Button 
            onClick={resetRace} 
            variant="outline"
            className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
          >
            {isComplete ? "Race Again" : "Reset"}
          </Button>
        </div>
        
        {isComplete && (
          <div className="mt-8 bg-gray-800 border border-gray-600 rounded-lg p-6 text-center">
            <h3 className="text-xl font-semibold text-green-400 mb-4">Race Complete!</h3>
            <div className="flex justify-center space-x-8 text-white">
              <div>
                <div className="text-3xl font-bold text-yellow-400">{wpm}</div>
                <div className="text-sm text-gray-400">WPM</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-400">{accuracy}%</div>
                <div className="text-sm text-gray-400">Accuracy</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-400">{errors}</div>
                <div className="text-sm text-gray-400">Errors</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}