const { WebSocketServer } = require('ws')

// Game state
let gameState = {
  id: Math.random().toString(36).substr(2, 9),
  text: "The quick brown fox jumps over the lazy dog. Programming is the art of telling another human being what one wants the computer to do. Code is like humor. When you have to explain it, it's bad.",
  players: [],
  isStarted: false,
  isFinished: false,
  countdown: 0
}

let countdownInterval = null

const sampleTexts = [
  "The quick brown fox jumps over the lazy dog. Programming is the art of telling another human being what one wants the computer to do.",
  "In the world of software development, clean code is not written by following a set of rules. You don't become a software craftsman by learning a list of heuristics.",
  "Technology is nothing. What's important is that you have a faith in people, that they're basically good and smart, and if you give them tools, they'll do wonderful things with them.",
  "The best programs are written when the programmer is seized by a great idea, and he sits down and programs it all in one session.",
  "Code is like humor. When you have to explain it, it's bad. The computer was born to solve problems that did not exist before."
]

const playerColors = [
  '#3B82F6', // Blue
  '#EF4444', // Red  
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
]

function getPlayerColor(index) {
  return playerColors[index % playerColors.length]
}

function broadcastGameState(server) {
  const message = JSON.stringify({
    type: 'gameState',
    data: gameState
  })
  
  // Broadcast to all connected clients
  server.publish('game', message)
}

function startCountdown(server) {
  gameState.countdown = 3
  broadcastGameState(server)
  
  countdownInterval = setInterval(() => {
    gameState.countdown--
    
    if (gameState.countdown <= 0) {
      clearInterval(countdownInterval)
      gameState.isStarted = true
      gameState.countdown = 0
      
      const startMessage = JSON.stringify({
        type: 'gameStarted',
        data: {}
      })
      
      server.publish('game', startMessage)
    }
    
    broadcastGameState(server)
  }, 1000)
}

function resetGame(server) {
  if (countdownInterval) clearInterval(countdownInterval)
  gameState = {
    id: Math.random().toString(36).substr(2, 9),
    text: sampleTexts[Math.floor(Math.random() * sampleTexts.length)],
    players: gameState.players.map(player => ({
      ...player,
      progress: 0,
      wpm: 0,
      isFinished: false,
      cursorPosition: 0
    })),
    isStarted: false,
    isFinished: false,
    countdown: 0
  }
  broadcastGameState(server)
}

function checkGameFinished(server) {
  const finishedPlayers = gameState.players.filter(p => p.isFinished)
  if (finishedPlayers.length === gameState.players.length && gameState.players.length > 0) {
    gameState.isFinished = true
    broadcastGameState(server)
    
    setTimeout(() => {
      resetGame(server)
    }, 10000)
  }
}

// Bun WebSocket Server
const server = Bun.serve({
  port: 3002,
  fetch(req, server) {
    const url = new URL(req.url)
    
    if (url.pathname === '/ws') {
      const upgraded = server.upgrade(req)
      if (!upgraded) {
        return new Response('WebSocket upgrade failed', { status: 400 })
      }
      return undefined
    }
    
    return new Response('WebSocket server running on /ws', { 
      headers: { 'Access-Control-Allow-Origin': '*' } 
    })
  },
  websocket: {
    open(ws) {
      console.log('New client connected')
      ws.data = { playerId: null }
      
      // Subscribe to game events
      ws.subscribe('game')
      
      // Send current game state
      ws.send(JSON.stringify({
        type: 'gameState',
        data: gameState
      }))
    },
    message(ws, message) {
      try {
        const data = JSON.parse(message.toString())
        
        switch (data.type) {
          case 'joinGame':
            const playerId = Math.random().toString(36).substr(2, 9)
            ws.data.playerId = playerId
            
            const newPlayer = {
              id: playerId,
              name: data.data.playerName,
              progress: 0,
              wpm: 0,
              isFinished: false,
              cursorPosition: 0,
              color: getPlayerColor(gameState.players.length)
            }
            
            gameState.players.push(newPlayer)
            
            ws.send(JSON.stringify({
              type: 'playerJoined',
              data: { playerId }
            }))
            
            // Broadcast to all clients
            broadcastGameState(server)
            break
            
          case 'startGame':
            if (gameState.players.length > 0 && !gameState.isStarted) {
              startCountdown(server)
            }
            break
            
          case 'updateProgress':
            if (ws.data.playerId && gameState.isStarted) {
              const player = gameState.players.find(p => p.id === ws.data.playerId)
              if (player) {
                player.progress = data.data.progress
                player.wpm = data.data.wpm
                player.isFinished = data.data.isFinished
                player.cursorPosition = data.data.cursorPosition || 0
                
                broadcastGameState(server)
                
                if (data.data.isFinished) {
                  checkGameFinished(server)
                }
              }
            }
            break
        }
      } catch (error) {
        console.error('Error parsing message:', error)
      }
    },
    close(ws) {
      console.log('Client disconnected')
      if (ws.data.playerId) {
        gameState.players = gameState.players.filter(p => p.id !== ws.data.playerId)
        
        broadcastGameState(server)
        
        if (gameState.players.length === 0) {
          resetGame(server)
        }
      }
    }
  }
})

console.log(`WebSocket server running on http://localhost:${server.port}/ws`)
console.log('Waiting for connections...')