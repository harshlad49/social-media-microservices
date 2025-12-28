 const logger = require('../utils/logger');
 const jwt = require('jsonwebtoken');
 const vaidateToken = (req, res, next) => { 
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if(!token){
      logger.warn(`Access attempted without vaild token !`)
    }
    if(!token){
      logger.warn(`Access attempted without token !`)
      return res.status(401).json({
        message : 'Authentication required!',
        success : false
      })
    
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if(err){
        logger.warn(`Invaid token!`)
        return res.status(401).json({
          message : 'Invaid token!',
          success : false
        })
      }
      req.user = user;
      next();
    })
 }
 module.exports = {vaidateToken};