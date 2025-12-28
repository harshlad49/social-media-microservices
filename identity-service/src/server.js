require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const {RateLimiterRedis} = require('rate-limiter-flexible');
const Redis = require('ioredis');
const  {rateLimit} = require("express-rate-limit")
const {RedisStore} = require('rate-limit-redis')
const routes = require('./routes/identity-service');
const errorHandler = require('./middleware/errorHandler');


const  app  = express();
const PORT = process.env.PORT || 3001;
mongoose
  .connect(process.env.MONGO_URI) 
  .then(() => logger.info('Connected to MongoDB'))
  .catch((e) => 
    logger.error('Failed to connect to MongoDB', e));
  const redisClient = new Redis(process.env.REDIS_URL);

     app.use(helmet())
     app.use(cors())
     app.use(express.json())

  app.use((req, res, next)=> {
    logger.info(`${req.method} ${req.url}`);
    logger.info(`Request body: ${req.body}`);
    next();

  });
 
//DDos protecton and rate limiting
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'middleware',
  points: 10,
  duration: 1,
});
app.use((req, res, next) => {
  rateLimiter.consume(req.ip)
    .then(() => next())
    .catch(() => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests'});
    });
});

//Ip based rate limiting for sensitive endpoints
const sensitiveEndpointsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler : (req, res) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests'});
  }, 
  store : new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  
  }),
});
//apply this sensitiveEndpointsLimiter to out routes
app.use('/api/auth/register', sensitiveEndpointsLimiter)
 //Routes
 app.use('/api/auth', routes);
 app.use(errorHandler);
//error handler 
app.listen(PORT, ()=>{
  logger.info(`Identity Server running on port ${PORT}`);
});

//unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at',promise, 'reason:', reason);
});



