require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const Redis = require("ioredis");
const cors = require("cors");
const helmet = require("helmet");
const postRoutes = require("./routes/post-routes");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const { connectToRabbitMQ  } = require("./utils/rabbitmq");

const app = express();
const port = process.env.PORT || 3002;


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => logger.info("Connected to MongoDB"))
  .catch((e) => logger.error("Error connecting to MongoDB", e));

const redisClient = new Redis(process.env.REDIS_URL);
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Recived ${req.method} request for ${req.url}`);
  logger.info(`Requset body, ${req.body}`);
  next();
})

app.use("/api/posts", (req, res, next)=> {
  req.redisClient = redisClient;
  next();
}, postRoutes);

app.use(errorHandler);


async function startServer() {
  try {
    await connectToRabbitMQ();
    app.listen(port,() => { 
       logger.info(`Post service running on port ${port}`);
      });
  } catch (error) { 
    logger.error("Error connecting to RabbitMQ", error)
    process.exit(1);
  }
}
startServer();

app.listen(port, () => {
  logger.info(`Post Service running on port ${port}`);
}); 

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at", promise, "reason:", reason);
});