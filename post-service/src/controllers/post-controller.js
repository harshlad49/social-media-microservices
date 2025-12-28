const { post } = require('../../../media-service/src/routes/media-routes');
const Post = require('../models/post');
const logger =require('../utils/logger');
const { publishEvent } = require('../utils/rabbitmq');
const {validateCreatePost} = require('../utils/Validation')

async function invaildataPostCache(req, input) {
  const cacheKey = `posts:${input}`;
  
  await req.redisClient.del(cacheKey);
  const keys = await req.redisClient.keys("posts:*");
  if (keys.length > 0) {
    await req.redisClient.del(keys);
  }
}

const createPost = async (req, res) => {
  logger.info("Creating post endpoint hit");
  try {
    const {error} = validateCreatePost(req.body);
        if (error) {
          logger.warn(`Validation error: ${error.details[0].message}`);

          return res.status(400).json({
             success: false,
            message: error.details[0].message,
            });
          }
    const { content, mediaIds}= req.body;
    const newlyCreatedPost = new Post({
      user : req.user.userId,
      content,
      mediaIds : mediaIds || [],
    });
    await newlyCreatedPost.save();
    await publishEvent("post.created", {
      postId: newlyCreatedPost._id.toString(),
      userId: newlyCreatedPost.user.toString(),
      content: newlyCreatedPost.content,
      createdAt: newlyCreatedPost.createdAt,
    });
    await invaildataPostCache(req, newlyCreatedPost._id.toString());
    logger.info("Post created successfully", newlyCreatedPost);
    res.status(201).json({
      success: true,
      message: "Post created successfully",
  });
  } catch (error) {
    logger.error("Error creating post", error);
    res.status(500).json({
      successs: false,
      message: "Error creating post",
    });
  }
};

const getAllPosts = async (req, res) => {
  try {
   
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const cachekey  = `posts:${page}:${limit}`;
    const cachedPosts = await req.redisClient.get(cachekey);
 
    if (cachedPosts) {
       return res.json(JSON.parse(cachedPosts));
    }

    const posts = await Post.find({}).sort({createdAt : -1}).skip(startIndex).limit(limit);
   
  const totalNoOfPosts = await Post.countDocuments();
  const result = {
    posts,
    currentPage : page,
    totalPages : Math.ceil(totalNoOfPosts / limit),
    totalPosts : totalNoOfPosts
  }
   // save your posts in redis cach
    await req.redisClient.set(cachekey, JSON.stringify(result));
   res.json(result);
  } catch (error) {
    logger.error("Error fetching all posts", error);
    res.status(500).json({
      successs: false,
      message: "Error fetching all posts",
    });
  }
};

const getPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const cachekey  = `posts:${postId}`;
    const cachedPost = await req.redisClient.get(cachekey);
    if (cachedPost) {
      return res.json(JSON.parse(cachedPost));
    }
    const singlePostDetailsbyId  = await Post.findById(postId);
     if(!singlePostDetailsbyId){
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
     }
     await req.redisClient.setex(cachekey, 3600, JSON.stringify(singlePostDetailsbyId));
     res.json(singlePostDetailsbyId);
  } catch (error) {
    logger.error("Error fetching  posts", error);
    res.status(500).json({
      successs: false,
      message: "Error fetching  posts by ID",
    });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });
     if(!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
     }
     await publishEvent('post.deleted', {
  postId: post._id.toString(),
  userId: req.user.userId,
  mediaIds: post.mediaIds
})
     await invaildataPostCache(req, req.params.id);
     
     res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting  posts", error);
    res.status(500).json({
      successs: false,
      message: "Error deleting posts",
    });
  }
};


module.exports = {createPost, getAllPosts, getPost, deletePost}