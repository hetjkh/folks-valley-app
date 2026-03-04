# Backend API Server

Simple Node.js API server using Express.

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Start the server:
```bash
npm start
```

The server will run on `http://43.241.147.175:3000`

## API Endpoint

- **GET** `/api/hello` - Returns a JSON response with message: "hello i am api"

## Important Notes

- Make sure your firewall allows incoming connections on port 3000
- Ensure your phone and computer are on the same network (or configure port forwarding if needed)
- The server listens on `0.0.0.0` to accept connections from any network interface

