const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const env = require('./src/config/env');
const socketHandler = require('./src/socket/socket.handler');
const eventConsumer = require('./src/events/event.consumer');

const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'socket-gateway' });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.corsOrigin,
    methods: ['GET', 'POST']
  }
});

(async () => {
  socketHandler.init(io);

  await eventConsumer.connect();

  server.listen(env.port, () => {
    console.log(`🚀 Socket Gateway running on port ${env.port}`);
  });
})();

