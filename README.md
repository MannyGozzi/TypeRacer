# Type Racer

A modern typing game built with Next.js, shadcn/ui, and WebSockets for real-time multiplayer functionality. Optimized to run with Bun for maximum performance.

## Features

- **Single Player Mode**: Practice typing with WPM and accuracy tracking
- **Multiplayer Mode**: Real-time racing against other players
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Real-time Updates**: WebSocket-based multiplayer functionality
- **Responsive Design**: Works on desktop and mobile devices
- **High Performance**: Powered by Bun runtime

## Getting Started

### Prerequisites

- **Bun** (recommended) or Node.js 18+
- Install Bun: `curl -fsSL https://bun.sh/install | bash`

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd type-racer
```

2. Install dependencies with Bun:
```bash
bun install
```

### Running the Application

#### Development Mode (Single Command)

Just run one command to start both Next.js and WebSocket server:

```bash
bun run dev
```

This starts the integrated server on **port 3000** with both:
- Next.js app at `http://localhost:3000`
- WebSocket server at `ws://localhost:3000`

#### Alternative Development Commands

- `bun run dev:next-only` - Start only Next.js (no multiplayer)
- `bun run server` - Start standalone WebSocket server on port 8080

#### Production Mode

1. Build the application:
```bash
bun run build
```

2. Start the production server:
```bash
bun run start
```

3. Start the WebSocket server in a separate process:
```bash
bun run server
```

## Available Scripts

- `bun run dev` - Start integrated server (Next.js + WebSocket on port 3000)
- `bun run dev:next-only` - Start only Next.js development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run server` - Start standalone WebSocket server (port 8080)
- `bun run lint` - Run ESLint
- `bun install` - Install dependencies

## Ngrok Integration

Since both the web app and WebSocket server run on the same port (3000), you can easily expose your app with ngrok:

```bash
# Start the app
bun run dev

# In another terminal, expose with ngrok
ngrok http 3000
```

This gives you a single URL that works for both the web interface and multiplayer WebSocket connections!

## How to Play

### Single Player
1. Select "Single Player" mode
2. Start typing the displayed text
3. Your WPM (Words Per Minute) and accuracy are tracked in real-time
4. Complete the text to see your final stats

### Multiplayer
1. Select "Multiplayer" mode
2. Enter your name to join a game
3. Wait for other players or start the game
4. Race against other players in real-time
5. See live progress of all participants

## Tech Stack

- **Runtime**: Bun (recommended) or Node.js
- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Components**: shadcn/ui, Tailwind CSS
- **Real-time Communication**: WebSockets (ws library)
- **Styling**: Tailwind CSS v4
- **Build Tool**: Turbopack

## Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── globals.css     # Global styles
│   └── page.tsx        # Main page component
├── components/         # React components
│   ├── ui/             # shadcn/ui components
│   ├── TypeRacer.tsx   # Single player component
│   └── MultiplayerTypeRacer.tsx # Multiplayer component
└── hooks/              # Custom React hooks
    └── useWebSocket.ts # WebSocket hook
server.js               # WebSocket server
```

## Performance Benefits with Bun

- **Faster startup times**: Bun starts ~4x faster than Node.js
- **Improved package installation**: `bun install` is significantly faster
- **Better memory usage**: More efficient runtime
- **Native TypeScript support**: No compilation step needed
- **Built-in bundler**: Faster development builds

## WebSocket Server

The WebSocket server handles:
- Player connections and disconnections
- Game state management
- Real-time progress updates
- Game countdown and synchronization
- Automatic game resets

## Customization

### Adding New Texts
Edit the `sampleTexts` array in `server.js` to add new typing challenges.

### Styling
Modify the Tailwind classes in the components or update the theme in `tailwind.config.js`.

### Game Logic
The typing logic is in the respective components (`TypeRacer.tsx` for single player, `MultiplayerTypeRacer.tsx` for multiplayer).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
