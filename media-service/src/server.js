require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mediaRouter = require('./routes/media-routes');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/authMiddleware');
const {handlePostDeleted} = require('./eventHandlers/media-event-handlers');
const app = express();
const PORT = process.env.PORT || 3003;
const { connectRabbitMQ, consumeEvents } = require('./utils/rabbitmq');

app.use(cors());
app.use(helmet());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    logger.info('MongoDB connected successfully');
  })
  .catch((err) => {
    logger.error('MongoDB connection error', err);
    process.exit(1);
  });

app.use('/api/media', mediaRouter);
app.use(errorHandler);
async function startServer() {
 try {
    await connectRabbitMQ();
    //consume all the events
    await consumeEvents('post.deleted', handlePostDeleted);
    app.listen(PORT, () => {
  logger.info(`Media Service running on port ${PORT}`);
});
  } catch (error) { 
    logger.error("Error connecting to RabbitMQ", error)
    process.exit(1);
  }
}
startServer();

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
