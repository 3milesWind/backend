const db = require("../utils/database");
const router = require("express").Router();

router.post("/email_register", async (req, res) => {
    let data;
    data = {
        email: req.body.email,
        password: req.body.password
    };

    let user = db.findOne("EZCampus", { email: data.email }, { projection: { "_id": 0 } });
    if (!user) {
        db.insertOne("EZCampus", data);
        res.status(200).json({ message: "User Created" });
    } else {
        res.status(409).json({ message: "user existed" });
    }
});

module.exports = router;