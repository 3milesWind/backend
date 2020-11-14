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
    res.status(200).json({ statusCode: 200, successful: true, message: "Post Created" });
});

/* Get All Posts */
router.get("/get_all_posts", async (req, res) => { 
    console.log("Get All Posts Function");
    const allPosts = await db.find('Posts', {}, {projection:{ _id: 0 }});
    console.log("allPosts: ", allPosts);
    res.status(200).json({"statusCode": 200, "data": allPosts});
});

/* Get a post detail */
// router.get("/get_all_posts?postId", async (req, res) => {

// });



module.exports = router;