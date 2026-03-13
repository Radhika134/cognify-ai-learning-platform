# AI Learning Optimization Platform

An AI-powered learning optimization platform that generates study plans, tracks learning analytics, and provides AI insights to improve student productivity.

## Project Structure

This is a full-stack web application with the following tech stack:
- **Frontend**: React with TypeScript (located in the `client` directory)
- **Backend**: Node.js with Express (located in the `server` directory)
- **Database**: MongoDB

### Client Directory
Contains the React frontend, structured with:
- `components/`: Reusable UI components
- `hooks/`: Custom React hooks
- `pages/`: Full page views
- `services/`: API calls and external services

### Server Directory
Contains the Node.js/Express backend, structured with:
- `config/`: Configuration files and environment variables
- `controllers/`: Route request handlers
- `middleware/`: Express middleware functions
- `models/`: MongoDB database models
- `routes/`: API route definitions

## Health Check
The backend includes a simple health-check endpoint:
- `GET /api/health` → returns `"Server running"`
