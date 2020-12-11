const db = require("../utils/database");

module.exports = {

    createPost: async function (data) {
        return await db.insertOne("Posts", data);
    },

    createComment: async function (postId, data) {
        return await db.updateOne("Posts", { postId: postId }, { $push: { commentList: data } });
    },

    getSinglePost: async function (postId) {
        return await db.findOne("Posts", { postId: postId }, {});
    },

    getAllPosts: async function () {
        return await db.find('Posts', {}, { projection: { _id: 0 } }, { "dateObj": -1 });
    },

    checkLikeUser: async function (postId, email) {
        return await db.findOne("Posts", { "postId": postId, likeList: { $elemMatch: { $eq: email } } }, { projection: { likes: 1 } });
    },

    updatePost: async function (data) {
        return await db.updateOne("Posts",
            { postId: data.postId },
            {
                $set: {
                    title: data.title,
                    description: data.description,
                    postType: data.postType
                }
            });
    },

    updatePostUserData: async function (email, data) {
        return await db.updateMany("Posts", { creatorEmail: email }, { $set: data });
    },

    updateComment: async function (postId, commentId, commentText) {
        return await db.updateOne("Posts", { "postId": postId, "commentList.commentId": commentId }, { $set: { "commentList.$.commentText": commentText } });
    },

    updateLikeList: async function (postId, email) {
        return await db.updateOne("Posts", { "postId": postId }, { $addToSet: { likeList: email } });
    },

    updateLikeNumber: async function (postId) {
        return await db.updateOne("Posts", { "postId": postId }, { $inc: { likes: 1 } });
    },

    deletePost: async function (postId) {
        return await db.deleteOne("Posts", { "postId": postId });
    },

    deleteComment: async function (postId, commentId) {
        return await db.updateOne("Posts", { postId: postId }, { $pull: { commentList: { commentId: commentId } } });
    }

};
