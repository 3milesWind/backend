const db = require("../utils/database");
const router = require("express").Router();
const crypto = require("crypto");

router.use(require("body-parser").json());

//create a post
router.post("/create_a_post", async (req, res) => { 
    let data;
    data = {
        postId: req.body.postId,
        title: req.body.title,
        description: req.body.description,
        date: req.body.date,
        views: req.body.views,
        likes: req.body.likes,
        creatorName: req.body.creatorName,
        creatorEmail: req.body.creatorEmail,
        postType: req.body.postType
    };
    // console.log("passin create post data is: ", data);

    let user = await db.findOne("Users", { email: data.creatorEmail }, { projection: { "profile": 1 } });
    
    if (!user) {
        res.status(404).json({ statusCode: 404, successful: false, message: "user not found" });
    } else {
        data.avatarlink = user.profile.avatarlink;
    }

    db.insertOne("Posts", data);
    res.status(200).json({ statusCode: 200, successful: true, message: "Post Created" });
});

/* Get All Posts */
router.get("/get_all_posts", async (req, res) => { 
    // console.log("Get All Posts Function");
    let allPosts = await db.find('Posts', {}, {projection:{ _id: 0 }});
    allPosts.reverse();
    // console.log("allPosts: ", allPosts);
    res.status(200).json({"statusCode": 200, "data": allPosts});
});

/* Get a post detail */
router.get("/get_a_post_detail", async ({ query: { postId } }, res) => {
    let thePost = await db.findOne("Posts", { postId: postId }, { projection: { "_id": 0 } });
    // console.log("a post detail: ", thePost);
    if (!thePost) {
        res.status(404).json({ statusCode: 404, message: "Post Does Not Exist!" });
    } else {
        res.status(200).json({ statusCode: 200, data: thePost });
    }
});

/* delete a post */
router.delete("/delete_a_post", async ({ query: { postId } }, res) => {
    let thePost = await db.findOne("Posts", { "postId": postId }, { projection: { "_id": 0 } });
    if (!thePost) {
        res.status(404).json({ statusCode: 404, message: "Post Does Not Exist!" });
    } else {
        db.deleteOne("Posts", thePost);
        res.status(200).json({ statusCode: 200, message: "success" });
    }
});

router.post("/updateTheCommentList", async (req, res) => {
    let user = await db.findOne("Users", { email: req.body.email }, { projection: { "userName": 1 } });
    if (!user) {
        res.status(404).json("user does not exist");
        return;
    }

    let data = {
        email: req.body.email,
        commentText: req.body.commentText,
        time: req.body.time,
        date: req.body.date,
        commentId: crypto.randomBytes(16).toString('hex')
    };

    let result = await db.updateOne("Posts", { postId: req.body.postId }, { $push: { commentList: data } });

    if (result.matchedCount == 0) {
        res.status(404).json({ statusCode: 404, message: "current post does not exist" });
    } else {
        res.status(200).json({ statusCode: 200, message: "success" });
    }
});

router.get("/fetchTheCommentList", async ({ query: { postId } }, res) => {
    let post = await db.findOne("Posts", { "postId": postId }, { projection: { "commentList": 1 } });
    let listlength = post.commentList ? post.commentList.length : 0;
    for (let i = 0; i < post.commentList.length; i++) {
        let user = await db.findOne("Users", { email: post.commentList[i].email }, { projection: { "userName": 1 } });
        post.commentList[i].userName = user.userName;
    }

    if (!post) {
        res.status(404).json({ statusCode: 404, message: "current post does not exist" });
    } else {
        res.status(200).json({ statusCode: 200, message: "success", commentList: post.commentList });
    }
});

router.delete("/deleteTheComment", async ( { query: { postId, commentId } }, res) => {
    let result = await db.updateOne("Posts", { postId: postId }, { $pull: { commentList: { commentId: commentId } } });
    if (result.matchedCount == 0) {
        res.status(404).json({ statusCode: 404, message: "current comment does not exist" });
    } else {
        res.status(200).json({ statusCode: 200, message: "success" });
    }
});

module.exports = router;