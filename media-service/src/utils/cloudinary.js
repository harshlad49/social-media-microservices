const cloudinary = require('cloudinary').v2;
const logger = require('./logger');

cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret
})

const uploadMediaToCloudinary =  (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto' },
      (error, result) => {
        if (error) {
          logger.error('Error while uploading media to Cloud');
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(file.buffer);
  });
};

const deleteMediaToCloudinary = async(publicId) => {
     try{
        const result = cloudinary.uploader.destroy(publicId);
        logger.info('Media deleted from cloud Storage', publicId);
        return result;
     }catch (error) {
        logger.error('Error while deleting media from Cloudinary');
        throw error;
     }
    }
const deleteMediaFromCloudinary = async (publicId) => {
  try {
    const result = await v2.uploader.destroy(publicId);
    logger.info(`Media deleted from Cloudinary: ${publicId}`);
    return result;
  } catch (error) {
    logger.error('Error while deleting media from Cloudinary', error);
    throw error;
  }
};
module.exports = {uploadMediaToCloudinary, deleteMediaToCloudinary, deleteMediaFromCloudinary};