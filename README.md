# SSE Chat App

A real-time chat application built with Node.js, Express, PostgreSQL, and Server-Sent Events (SSE).

## Features

- Real-time messaging using Server-Sent Events
- PostgreSQL database for persistent message storage
- XSS protection with HTML escaping
- Input validation and sanitization
- Responsive design for mobile and desktop
- Japanese language support
- Docker Compose for easy local development

## Quick Start with Docker Compose

### Prerequisites
- Docker and Docker Compose installed

### Local Development

```bash
# Clone the repository
git clone <repository-url>
cd chat-app

# Start PostgreSQL and the application
npm run docker:up

# View logs
npm run docker:logs

# Access the application
open http://localhost:8000
```

### Docker Commands

```bash
# Start all services
npm run docker:up

# Stop all services
npm run docker:down

# View logs
npm run docker:logs

# Rebuild containers
npm run docker:build

# Restart just the app
npm run docker:restart

# Clean up (removes volumes)
npm run docker:clean
```

### Manual Setup (without Docker)

```bash
# Install dependencies
npm install

# Set up PostgreSQL database
# Update DATABASE_URL in .env file

# Start the server
npm start
```

### Environment Variables

- `PORT` - Server port (default: 8000)
- `NODE_ENV` - Environment mode (development/production)
- `DATABASE_URL` - PostgreSQL connection string

### Railway Deployment

1. Connect your GitHub repository to Railway
2. Add PostgreSQL database service to your Railway project
3. Railway will automatically provide DATABASE_URL environment variable
4. Deploy automatically on push

#### Heroku Deployment

```bash
# Create Heroku app
heroku create your-app-name

# Deploy
git push heroku main
```

## API Endpoints

- `GET /` - Serve the chat interface
- `POST /messages` - Send a new message
- `GET /events` - SSE endpoint for real-time updates
- `GET /style.css` - CSS stylesheet
- `GET /script.js` - Client-side JavaScript

## Technical Details

- **Backend**: Node.js with Express
- **Database**: PostgreSQL with connection pooling
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Real-time**: Server-Sent Events (SSE)
- **Security**: XSS protection, input validation
- **Testing**: Jest with comprehensive test suite
- **Deployment**: Railway-optimized with health checks

## Performance

- Single message response: ~38ms
- Burst processing: 100 messages in ~49ms
- Static file serving: <10ms
- Memory efficient with automatic cleanup

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers with SSE support

## License

MIT License