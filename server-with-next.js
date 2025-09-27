const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { WebSocketServer } = require('ws')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

// Initialize Next.js
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

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

function broadcastGameState(wss) {
  const message = JSON.stringify({
    type: 'gameState',
    data: gameState
  })
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  })
}

function startCountdown(wss) {
  gameState.countdown = 3
  broadcastGameState(wss)
  
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
      
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(startMessage)
        }
      })
    }
    
    broadcastGameState(wss)
  }, 1000)
}

function resetGame(wss) {
  clearInterval(countdownInterval)
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
  }
  broadcastGameState(wss)
}

function checkGameFinished(wss) {
  const finishedPlayers = gameState.players.filter(p => p.isFinished)
  if (finishedPlayers.length === gameState.players.length && gameState.players.length > 0) {
    gameState.isFinished = true
    broadcastGameState(wss)
    
    setTimeout(() => {
      resetGame(wss)
    }, 10000)
  }
}

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Setup WebSocket server with proper configuration
  const wss = new WebSocketServer({ 
    server,
    path: '/ws',
    verifyClient: (info) => {
      // Allow all origins in development
      return true
    }
  })

  wss.on('connection', (ws, req) => {
    console.log('New client connected from:', req.socket.remoteAddress)
    
    ws.playerId = null
    
    // Handle connection errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error)
    })
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message)
        
        switch (data.type) {
          case 'joinGame':
            const playerId = Math.random().toString(36).substr(2, 9)
            ws.playerId = playerId
            
            const newPlayer = {
              id: playerId,
              name: data.data.playerName,
              progress: 0,
              wpm: 0,
              isFinished: false
            }
            
            gameState.players.push(newPlayer)
            
            ws.send(JSON.stringify({
              type: 'playerJoined',
              data: { playerId }
            }))
            
            broadcastGameState(wss)
            break
            
          case 'startGame':
            if (gameState.players.length > 0 && !gameState.isStarted) {
              startCountdown(wss)
            }
            break
            
          case 'updateProgress':
            if (ws.playerId && gameState.isStarted) {
              const player = gameState.players.find(p => p.id === ws.playerId)
              if (player) {
                player.progress = data.data.progress
                player.wpm = data.data.wpm
                player.isFinished = data.data.isFinished
                
                broadcastGameState(wss)
                
                if (data.data.isFinished) {
                  checkGameFinished(wss)
                }
              }
            }
            break
            
          default:
            console.log('Unknown message type:', data.type)
        }
      } catch (error) {
        console.error('Error parsing message:', error)
      }
    })
    
    ws.on('close', () => {
      console.log('Client disconnected')
      if (ws.playerId) {
        gameState.players = gameState.players.filter(p => p.id !== ws.playerId)
        broadcastGameState(wss)
        
        if (gameState.players.length === 0) {
          resetGame(wss)
        }
      }
    })
    
    // Send current game state to new client
    ws.send(JSON.stringify({
      type: 'gameState',
      data: gameState
    }))
  })

  // Add error handling for WebSocket server
  wss.on('error', (error) => {
    console.error('WebSocket Server error:', error)
  })

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(`> WebSocket server running on ws://${hostname}:${port}/ws`)
  })
}).catch((ex) => {
  console.error('Failed to start server:', ex)
  process.exit(1)
})