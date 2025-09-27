const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

let gameState = {
  id: Math.random().toString(36).substr(2, 9),
  text: "The quick brown fox jumps over the lazy dog. Programming is the art of telling another human being what one wants the computer to do. Code is like humor. When you have to explain it, it's bad.",
  players: [],
  isStarted: false,
  isFinished: false,
  countdown: 0
};

let countdownInterval = null;

const sampleTexts = [
  "The quick brown fox jumps over the lazy dog. Programming is the art of telling another human being what one wants the computer to do.",
  "In the world of software development, clean code is not written by following a set of rules. You don't become a software craftsman by learning a list of heuristics.",
  "Technology is nothing. What's important is that you have a faith in people, that they're basically good and smart, and if you give them tools, they'll do wonderful things with them.",
  "The best programs are written when the programmer is seized by a great idea, and he sits down and programs it all in one session.",
  "Code is like humor. When you have to explain it, it's bad. The computer was born to solve problems that did not exist before."
];

function broadcastGameState() {
  const message = JSON.stringify({
    type: 'gameState',
    data: gameState
  });
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function startCountdown() {
  gameState.countdown = 3;
  broadcastGameState();
  
  countdownInterval = setInterval(() => {
    gameState.countdown--;
    
    if (gameState.countdown <= 0) {
      clearInterval(countdownInterval);
      gameState.isStarted = true;
      gameState.countdown = 0;
      
      // Send game started message
      const startMessage = JSON.stringify({
        type: 'gameStarted',
        data: {}
      });
      
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(startMessage);
        }
      });
    }
    
    broadcastGameState();
  }, 1000);
}

function resetGame() {
  clearInterval(countdownInterval);
  gameState = {
    id: Math.random().toString(36).substr(2, 9),
    text: sampleTexts[Math.floor(Math.random() * sampleTexts.length)],
    players: gameState.players.map(player => ({
      ...player,
      progress: 0,
      wpm: 0,
      isFinished: false
    })),
    isStarted: false,
    isFinished: false,
    countdown: 0
  };
  broadcastGameState();
}

function checkGameFinished() {
  const finishedPlayers = gameState.players.filter(p => p.isFinished);
  if (finishedPlayers.length === gameState.players.length && gameState.players.length > 0) {
    gameState.isFinished = true;
    broadcastGameState();
    
    // Auto-reset game after 10 seconds
    setTimeout(() => {
      resetGame();
    }, 10000);
  }
}

wss.on('connection', (ws) => {
  console.log('New client connected');
  
  ws.playerId = null;
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'joinGame':
          const playerId = Math.random().toString(36).substr(2, 9);
          ws.playerId = playerId;
          
          const newPlayer = {
            id: playerId,
            name: data.data.playerName,
            progress: 0,
            wpm: 0,
            isFinished: false
          };
          
          gameState.players.push(newPlayer);
          
          ws.send(JSON.stringify({
            type: 'playerJoined',
            data: { playerId }
          }));
          
          broadcastGameState();
          break;
          
        case 'startGame':
          if (gameState.players.length > 0 && !gameState.isStarted) {
            startCountdown();
          }
          break;
          
        case 'updateProgress':
          if (ws.playerId && gameState.isStarted) {
            const player = gameState.players.find(p => p.id === ws.playerId);
            if (player) {
              player.progress = data.data.progress;
              player.wpm = data.data.wpm;
              player.isFinished = data.data.isFinished;
              
              broadcastGameState();
              
              if (data.data.isFinished) {
                checkGameFinished();
              }
            }
          }
          break;
          
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
    if (ws.playerId) {
      gameState.players = gameState.players.filter(p => p.id !== ws.playerId);
      broadcastGameState();
      
      // If no players left, reset the game
      if (gameState.players.length === 0) {
        resetGame();
      }
    }
  });
  
  // Send current game state to new client
  ws.send(JSON.stringify({
    type: 'gameState',
    data: gameState
  }));
});

console.log('WebSocket server started on port 8080');
console.log('Waiting for connections...');