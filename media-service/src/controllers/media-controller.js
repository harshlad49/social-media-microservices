const { log } = require('winston')
const { uploadMediaToCloudinary } = require('../utils/cloudinary')
const logger = require('../utils/logger')
const Media = require('../models/media');
const uploadMedia = async (req, res) => { 
     logger.info('Starting media upload')
     try{
      console.log(req.file, "req.filereq.file")
       if(!req.file){
           logger.error('No file found. Please add a file and try again!')
           return res.status(400).json({
            success : false,
            message : 'No file found. Please add a file and try again!'

           })
       }
          const {originalname, mimetype, buffer} = req.file
          const userId = req.user.userId
             logger.info(`File details: name=${originalname}, mimeType=${mimetype}`)
             logger.info('Uploading to cloudinary starting...')
             const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file) 
             log
             logger.info(`Cloudinary upload Successfully. Public Id: ${cloudinaryUploadResult.public_id}`)
             const newlyCreatedMedia = new Media({
              publicId: cloudinaryUploadResult.public_id,
              originalName: originalname,
              mimeType: mimetype,
              url: cloudinaryUploadResult.secure_url,
              userId
             
             })
             await newlyCreatedMedia.save()
             res.status(201).json({
               success : true,
               mediaId : newlyCreatedMedia._id,
               url : newlyCreatedMedia.url,
               message : 'Media uploaded successfully'
             })


           } catch(error){
            logger.error("Error creating post", error);
            res.status(500).json({
              success: false,
              message: "Error creating post",
            })

           }
          }
const getAllMedias = async (req, res) => {
  try {
    const results = await Media.find({});
    res.json({results});
  }catch (error) {
    logger.error('Error while fetching medias', error);
    res.status(500).json({
      success: false,
      message: 'Error creating medias'
    });
  }
}
module.exports = {uploadMedia, getAllMedias};