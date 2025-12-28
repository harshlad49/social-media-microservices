// import { logger } from '../utils/logger';
// import Media from '../models/media.js';
// const { deleteMediaFromCloudinary } = require('../utils/cloudinary');
// const handlePostDeleted = async (event) => {
//  console.log(event, "event in media service");
//  const {postId, mediaIds} = event
//  try{
//   const mediaToDelete = await Media.find({ _id: { $in: mediaIds } })

//   for(const media of mediaToDelete){
//     await deleteMediaFromCloudinary(media.publicId);
//     await Media.findByIdAndDelete(media._id);
//     logger.info(`Deleted media with ID: ${media._id} associated with post ID: ${postId}`);
//      logger.info(`Deleted media ${media._id} associated with post ID: ${postId}`);
//   }

// } catch(error){
//  logger.error(error,"Error handling post deletion:");
// }}
// module.exports = {handlePostDeleted};
const logger = require('../utils/logger');
const Media = require('../models/media');
const { deleteMediaFromCloudinary } = require('../utils/cloudinary');

const handlePostDeleted = async (event) => {
  console.log(event, 'event in media service');

  const { postId, mediaIds } = event;

  try {
    const mediaToDelete = await Media.find({
      _id: { $in: mediaIds },
    });

    for (const media of mediaToDelete) {
      await deleteMediaFromCloudinary(media.publicId);
      await Media.findByIdAndDelete(media._id);

      logger.info(
        `Deleted media ${media._id} associated with post ID: ${postId}`
      );
    }
  } catch (error) {
    logger.error('Error handling post deletion:', error);
  }
};

module.exports = { handlePostDeleted };
