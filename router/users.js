const db = require("../utils/database");
const router = require("express").Router();

router.use(require("body-parser").json());

router.post("/email_register", async (req, res) => { 
    
    let data;
    data = {
        email: req.body.user.email,
        password: req.body.user.password
    };
    
    console.log(data);

    let user = db.findOne("EZCampus", { email: data.email }, { projection: { "_id": 0 } });
    if (!user) {
        db.insertOne("EZCampus", data);
        res.status(200).json({ message: "User Created" });
    } else {
        res.status(409).json({ message: "user existed" });
    }
    
});

module.exports = router;