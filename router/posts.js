const db = require("../utils/database");
const router = require("express").Router();

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
    console.log("passin create post data is: ", data);

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
    console.log("Get All Posts Function");
    let allPosts = await db.find('Posts', {}, {projection:{ _id: 0 }});
    allPosts.reverse();
    console.log("allPosts: ", allPosts);
    res.status(200).json({"statusCode": 200, "data": allPosts});
});

/* Get a post detail */
router.get("/get_a_post_detail", async ({ query: { postId }}, res) => {
    let thePost = await db.findOne("Posts", { postId: postId }, { projection: { "_id": 0 } });
    console.log("a post detail: ", thePost);
    if (!thePost) {
        res.status(404).json({ statusCode: 404, message: "Post Does Not Exist!" });
    } else {
        res.status(200).json({ statusCode: 200, data: thePost });
    }
});



module.exports = router;