const db = require("../utils/database");
const router = require("express").Router();

router.use(require("body-parser").json());

//signup
router.post("/email_register", async (req, res) => { 
    
    let data;
    data = {
        email: req.body.user.email,
        password: req.body.user.password
    };
    
    console.log(data);

    let user = await db.findOne("Users", { email: data.email }, { projection: { "_id": 0 } });
    console.log(user);

    if (!user) {//user's email not signed up, now sign up with email+password
        db.insertOne("Users", data);
        res.status(200).json({ message: "User Created" });
    } else {
        res.status(409).json({ message: "User existed" });
    }    
});

//login
router.post("/email_login", async (req, res) => { 
    let data;
    data = {
        email: req.body.user.email,
        password: req.body.user.password
    };
    console.log(data);
    let user = await db.findOne("Users", { email: data.email }, { projection: { "_id": 0 } });
    console.log(user);

    
    if (!user) {//user email not found in db
        res.status(404).json({ message: "User Not Found" });
    } else {//user email found in db
        if(req.body.user.password==user.password){//password match
            res.status(200).json({ message: "Correct Password" });
        } else {//password NOT match
            res.status(401).json({ message: "Incorrect Password" });
        }
    }    
});



module.exports = router;