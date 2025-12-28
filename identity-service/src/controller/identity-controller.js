const { log } = require('winston');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const logger = require('../utils/logger');
const { validateRegistration, validateLogin } = require('../utils/Validation');
const RefreshToken = require('../models/RefreshToken');
const registerUser = async (req, res) => {
  logger.info('Registering endpoint hit...')
  try {
    // validate the schema
   const {error} = validateRegistration(req.body);
    if (error) {
      logger.warn(`Validation error: ${error.details[0].message}`);
      return res.status(400).json({
         success: false,
        message: error.details[0].message,
        });
    }
    const { username, email, password } = req.body
    let user = await User.findOne({ $or: [ { username }, { email } ] });
    if (user) {
      logger.warn('User already exists ');
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }
    user = new User({ username, email, password });
    await user.save();
     logger.info('User Saved successfully', user._id);
     const {accessToken, refreshToken} = await generateToken(user);

     res.status(201).json({
      success: true,
      message: 'User registered successfully',
      accessToken,
      refreshToken
    });
  }catch (e) {
    logger.error(`Registration error: ${e.message}`);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });

  } 
  };



// user login
const loginUser = async(req,res)=> {
  logger.info("Login endpoint hit...");
  try{
    const {error}
    = validateLogin(req.body);
    
     if (error) {
      logger.warn(`Validation error: ${error.details[0].message}`);
      return res.status(400).json({
         success: false,
        message: error.details[0].message,
        });

      }
      const {email, password} = req.body;
      const user = await User.findOne({email});
      if (!user){
        logger.warn('Invalid user');
       return res.status(400).json({
        success: false,
        message: 'Invalid user',
       });

      }
      // user valid password or not
      const isvalidPassword = await user.comparePassword(password);
            if (!isvalidPassword){
        logger.warn('Invalid password');
       return res.status(400).json({
        success: false,
        message: 'Invalid credentils',
       });

      }
      const {accessToken, refreshToken} = await generateToken(user);
      res.json({
        accessToken,
        refreshToken,
        userId :user._id
      })
  }catch (e) {
    logger.error(`Login error: ${e.message}`);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });

  }
}
//refrensh token
const refreshTokenUser = async (req, res) => {
  try{
    const {refreshToken} = req.body;
     if (!refreshToken) {
      logger.warn('Refresh token missing');
      return res.status(400).json({
        success: false,
        message: 'Refresh token missing',
      });
    }
    const storedToken  = await Refreshtoken.findOne({token: refreshToken});
    if (!storedToken || storedToken.expiresAt < new Date()) {
      logger.warn('Invalid or expired refresh token');

      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }
    const {accessToken : newAccessToken, refreshToken: newRefreshToken} = await generateToken(storedToken.user);
    //delere the old refresh token
    await RefreshToken.deleteOne({_id: storedToken,_id});

  }catch (e) {
 
  logger.info('Refresh token endpoint hit...');
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
  });
}
}
//logout

const logoutUser = async (req, res) => {
     logger.info('Logout endpoint hit...');
     try {
      const {refreshToken} = req.body
      if (!refreshToken) {
        logger.warn('Refresh token missing');
        return res.status(400).json({
          success: false,
          message: 'Refresh token missing',
        });
      }
      await RefreshToken.deleteOne({token: refreshToken});
        logger.info('Refresh token deleted for logout');
        res.json({
          success: true,
          message: 'Logout successful',
        });
     }catch (e) {
      logger.error("Errorn while logging out", e); 
       res.status(500).json({
    success: false,
    message: 'Internal Server Error',
  });
     }}

module.exports = { registerUser, loginUser, refreshTokenUser, logoutUser };