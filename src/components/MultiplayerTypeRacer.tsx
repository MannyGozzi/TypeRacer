"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useWebSocket } from "@/hooks/useWebSocket";

interface Player {
  id: string;
  name: string;
  progress: number;
  wpm: number;
  isFinished: boolean;
}

interface GameState {
  id: string;
  text: string;
  players: Player[];
  isStarted: boolean;
  isFinished: boolean;
  countdown: number;
}

export default function MultiplayerTypeRacer() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [userInput, setUserInput] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus management for multiplayer
  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current && gameState?.isStarted) {
        inputRef.current.focus();
      }
    };
    
    focusInput();
    
    const handlePageClick = () => {
      if (gameState?.isStarted && !gameState?.isFinished) {
        focusInput();
      }
    };
    
    document.addEventListener('click', handlePageClick);
    document.addEventListener('keydown', focusInput);
    
    return () => {
      document.removeEventListener('click', handlePageClick);
      document.removeEventListener('keydown', focusInput);
    };
  }, [gameState?.isStarted, gameState?.isFinished]);

  const { isConnected, connectionError, sendMessage } = useWebSocket({
    url: 'ws://localhost:3002/ws',
    onMessage: (message) => {
      switch (message.type) {
        case 'gameState':
          setGameState(message.data);
          break;
        case 'gameStarted':
          setStartTime(Date.now());
          break;
        case 'playerJoined':
          setIsJoined(true);
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    },
    onConnect: () => {
      console.log('Connected to WebSocket server');
    },
    onDisconnect: () => {
      console.log('Disconnected from WebSocket server');
      setIsJoined(false);
    }
  });

  const joinGame = () => {
    if (playerName.trim() && isConnected) {
      sendMessage({
        type: 'joinGame',
        data: { playerName: playerName.trim() }
      });
    }
  };

  const startGame = () => {
    if (isConnected) {
      sendMessage({
        type: 'startGame',
        data: {}
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserInput(value);

    if (!gameState || !gameState.isStarted) return;

    let newIndex = 0;
    for (let i = 0; i < value.length && i < gameState.text.length; i++) {
      if (value[i] === gameState.text[i]) {
        newIndex = i + 1;
      } else {
        break;
      }
    }

    setCurrentIndex(newIndex);

    const progress = (newIndex / gameState.text.length) * 100;
    const timeElapsed = startTime ? (Date.now() - startTime) / 60000 : 0;
    const wordsTyped = gameState.text.slice(0, newIndex).split(' ').length;
    const wpm = timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0;

    sendMessage({
      type: 'updateProgress',
      data: {
        progress,
        wpm,
        isFinished: newIndex >= gameState.text.length
      }
    });
  };

  const renderText = () => {
    if (!gameState) return null;

    return gameState.text.split('').map((char, index) => {
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

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <div className="text-xl text-white mb-4">
              {connectionError ? 'Connection Failed' : 'Connecting to server...'}
            </div>
            <div className="text-sm text-gray-400 mb-4">
              {connectionError || 'Make sure the server is running'}
            </div>
            {connectionError && (
              <div className="space-y-2">
                <div className="text-xs text-gray-500">
                  To start the server, run: <code className="bg-gray-700 px-2 py-1 rounded text-yellow-400">bun run dev</code>
                </div>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                  className="mt-4 bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                >
                  Retry Connection
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Multiplayer Type Race</h1>
            <p className="text-lg text-gray-400">Enter your name to join the race</p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
            <div className="text-center mb-4">
              <span className="text-gray-400 text-sm">multiplayer</span>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="playerName" className="text-sm font-medium text-gray-300">
                  Your Name
                </label>
                <input
                  id="playerName"
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && joinGame()}
                  className="w-full p-4 text-lg bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-yellow-400 focus:outline-none"
                  placeholder="Enter your name..."
                  maxLength={20}
                  autoFocus
                />
              </div>
              <Button 
                onClick={joinGame} 
                disabled={!playerName.trim()}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold py-3 text-lg"
              >
                Join Game
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with player count */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">{gameState?.players.length || 0}</div>
              <div className="text-sm text-gray-400">Players</div>
            </div>
            {gameState?.isStarted && (
              <>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">Racing</div>
                  <div className="text-sm text-gray-400">Status</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Players List */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="text-center mb-4">
            <span className="text-gray-400 text-sm">players in lobby</span>
          </div>
          <div className="space-y-3">
            {gameState?.players.map((player, index) => (
              <div key={player.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-gray-900 font-bold text-sm">
                    {index + 1}
                  </div>
                  <span className="font-medium text-white text-lg">{player.name}</span>
                  {player.isFinished && (
                    <div className="bg-green-500 text-gray-900 px-2 py-1 rounded text-xs font-bold">
                      FINISHED
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-yellow-400 font-bold">{player.wpm}</div>
                    <div className="text-xs text-gray-400">WPM</div>
                  </div>
                  <div className="w-32">
                    <div className="w-full bg-gray-600 rounded-full h-3">
                      <div 
                        className="bg-yellow-400 h-3 rounded-full transition-all duration-300" 
                        style={{ width: `${player.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-gray-300 font-mono text-sm w-12">
                    {Math.round(player.progress)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Game Area */}
        <div className="bg-gray-800 rounded-lg p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="text-center">
              <span className="text-gray-400 text-sm">multiplayer race</span>
            </div>
            {!gameState?.isStarted && !gameState?.countdown && (
              <Button 
                onClick={startGame}
                className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold px-6 py-2"
              >
                Start Race
              </Button>
            )}
          </div>

          {gameState?.countdown > 0 && (
            <div className="text-center mb-8">
              <div className="text-6xl font-bold text-yellow-400 mb-2">
                {gameState.countdown}
              </div>
              <div className="text-gray-400 text-lg">Get ready...</div>
            </div>
          )}

          {gameState?.text && (
            <>
              <div 
                className="text-2xl leading-relaxed font-mono tracking-wide text-center max-w-4xl mx-auto mb-8 cursor-text"
                onClick={() => inputRef.current?.focus()}
              >
                {renderText()}
              </div>
              
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={handleInputChange}
                disabled={!gameState.isStarted || gameState.isFinished}
                className="opacity-0 absolute top-0 left-0 w-1 h-1 pointer-events-none"
                style={{ 
                  position: 'fixed', 
                  top: '-9999px', 
                  left: '-9999px',
                  zIndex: -1
                }}
                autoFocus
              />
            </>
          )}

          {gameState?.isFinished && (
            <div className="text-center mt-8">
              <div className="text-2xl font-bold text-green-400 mb-4">Race Complete!</div>
              <div className="text-gray-400">Starting new race in 10 seconds...</div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-center">
          <div className="text-gray-400 text-sm">
            {!gameState?.isStarted && !gameState?.countdown 
              ? "Click 'Start Race' to begin" 
              : gameState?.isStarted 
              ? "Click on the text area or anywhere to start typing"
              : "Get ready to type!"}
          </div>
        </div>
      </div>
    </div>
  );
}