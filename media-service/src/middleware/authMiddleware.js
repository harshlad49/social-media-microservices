const logger = require('../utils/logger');
const authenticateRequest = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if(!userId){
    logger.warn(`Access attempted without user ID`)
    return res.status(401).json({
      success: false,
      message:'Authencation required! Please login to continue'
  })
  }
   req.user = {userId}
   next();
}
function errorHandler(err, req, res, next) {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
}
module.exports ={ authenticateRequest, errorHandler};