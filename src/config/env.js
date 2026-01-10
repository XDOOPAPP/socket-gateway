require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3102,
  rabbitMQ_url: process.env.RABBITMQ_URL,
  corsOrigin: process.env.CORS_ORIGIN,
  jwtSecret: process.env.JWT_SECRET,
};
