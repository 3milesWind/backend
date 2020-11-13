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

    db.insertOne("Posts", data);
    res.status(200).json({ successful: true, message: "Post Created", statusCode: 200 });
});


/* Get All Posts */
router.get("/get_all_posts", async (req, res) => { 
    console.log("Get All Posts Function");
    const allPosts = await db.find('Posts');
    console.log("allPosts: ", allPosts);
    res.send(allPosts);
    res.status(200);
});


module.exports = router;