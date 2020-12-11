const router = require("express").Router();
const crypto = require("crypto");

//models
const userModel = require("../model/userModel");
const postModel = require("../model/postModel");

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
    
    data.dateObj = new Date(data.date);

    let user = await userModel.getUser(data.creatorEmail);
    
    if (!user) {
        res.status(404).json({ statusCode: 404, successful: false, message: "user not found" });
    } else {
        let avatarlink = user.profile ? user.profile.avatarlink : null;
        data.avatarlink = avatarlink;
    }

    postModel.createPost(data);
    res.status(200).json({ statusCode: 200, successful: true, message: "Post Created" });
});

router.post("/update_a_post", async (req, res) => {
    let data = req.body;
    data.description = data.description.replace(
        '<p data-f-id="pbf" style="text-align: center; font-size: 14px; margin-top: 30px; opacity: 0.65; font-family: sans-serif;">Powered by <a href="https://www.froala.com/wysiwyg-editor?pb=1" title="Froala Editor">Froala Editor</a></p>', '');
    let result = await postModel.updatePost(data);
    if (result.matchedCount == 0) {
        res.status(404).json({ statusCode: 404, message: "Post Does Not Exist!" });
    } else {
        res.status(200).json({ statusCode: 200, message: "success" });
    }
});

/* Get All Posts */
router.get("/get_all_posts", async (req, res) => { 
    let allPosts = await postModel.getAllPosts();
    res.status(200).json({"statusCode": 200, "data": allPosts});
});

/* Get a post detail */
router.get("/get_a_post_detail", async ({ query: { postId } }, res) => {
    let thePost = await postModel.getSinglePost(postId);
    if (!thePost) {
        res.status(404).json({ statusCode: 404, message: "Post Does Not Exist!" });
    } else {
        res.status(200).json({ statusCode: 200, data: thePost });
    }
});

/* delete a post */
router.delete("/delete_a_post", async ({ query: { postId } }, res) => {
    let result = await postModel.deletePost(postId);

    if (result.deletedCount == 0) {
        res.status(404).json({ statusCode: 404, message: "Post Does Not Exist!" });
    } else {
        res.status(200).json({ statusCode: 200, message: "success" });
    }
});

router.post("/updateTheCommentList", async (req, res) => {
    let user = await userModel.getUser(req.body.email);
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

    let result = await postModel.createComment(req.body.postId, data);

    if (result.matchedCount == 0) {
        res.status(404).json({ statusCode: 404, message: "current post does not exist" });
    } else {
        res.status(200).json({ statusCode: 200, message: "success" });
    }
});

router.get("/fetchTheCommentList", async ({ query: { postId } }, res) => {
    let post = await postModel.getSinglePost(postId);
    if (!post) {
        res.status(404).json({ statusCode: 404, message: "current post does not exist" });
    } else {
        let listlength = post.commentList ? post.commentList.length : 0;
        for (let i = 0; i < listlength; i++) {
            let user = await userModel.getUser(post.commentList[i].email);
            post.commentList[i].userName = user.userName;
        }
        res.status(200).json({ statusCode: 200, message: "success", commentList: post.commentList });
    }
});

router.delete("/deleteTheComment", async ( { query: { postId, commentId } }, res) => {
    let result = await postModel.deleteComment(postId, commentId);
    if (result.matchedCount == 0) {
        res.status(404).json({ statusCode: 404, message: "current comment does not exist" });
    } else {
        res.status(200).json({ statusCode: 200, message: "success" });
    }
});

router.post("/updateTheComment", async (req, res) => {
    let data = req.body;
    let result = await postModel.updateComment(data.postId, data.commentId, data.commentText);
    
    if (result.matchedCount == 0) {
        res.status(404).json({ statusCode: 404, message: "current comment does not exist" });
    } else {
        res.status(200).json({ statusCode: 200, message: "success" });
    }
});

router.post("/like/like", async (req, res) => {
    let email = req.body.email;
    let postId = req.body.postId;

    let result = await postModel.updateLikeList(postId, email);

     if (result.modifiedCount == 0) {
        res.status(500).json({ statusCode: 500, message: "like already exist!" });
     } else {
        await postModel.updateLikeNumber(postId);
        res.status(200).json({ statusCode: 200, message: "success" });
    }
});

router.get("/like/number", async ({ query: { postId } }, res) => {
    let post = await postModel.getSinglePost(postId);
    
    if (!post) {
        res.status(404).json({ statusCode: 404, message: "Post Does Not Exist!" });
    } else {
        res.status(200).json({ statusCode: 200, likeNumber: post.likes });
    }
});

router.get("/like/check", async ({ query: { postId, email } }, res) => {
    let result = await postModel.checkLikeUser(postId, email);
    
    if (result) {
        res.status(200).json({ statusCode: 200, exist: true });
    } else {
        res.status(200).json({ statusCode: 200, exist: false });
    }
});


module.exports = router;
