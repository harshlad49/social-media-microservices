 const mongoose = require('mongoose');

 const postSchema = mongoose.Schema({
    user: {
        type: String,
        required: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
     content : {
        type: String,
        required: true
      },
      mediaIds : [
        {
          type: String,
        }
      ],
      createdAt : {
        type: Date,
        default: Date.now
      }
    }, {timestamps: true})
//because we will be having a diff service for search
postSchema.index({constent: "text"})
const Post = mongoose.model('Post', postSchema);
module.exports = Post;