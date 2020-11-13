const db = require("../utils/database");
const router = require("express").Router();

router.use(require("body-parser").json());

//signup
router.post("/email_register", async (req, res) => { 
    
    let data;
    data = {
        email: req.body.email,
        userName: req.body.userName,
        password: req.body.password
    };
    
    console.log("passin signup data is: ", data);

    let user = await db.findOne("Users", { email: data.email }, { projection: { "_id": 0 } });
    console.log('find signup user is: ', user);

    if (!user) {//user's email not signed up, now sign up with email+password
        db.insertOne("Users", data);
        res.status(200).json({ message: "User Created", statusCode: 200 });
    } else {
        res.status(403).json({ message: "User existed", statusCode: 403 });
    }    
});

//login
router.post("/email_login", async (req, res) => { 
    let data;
    data = {
        email: req.body.email,
        password: req.body.password
    };
    console.log("passin login data is: ", data);
    let user = await db.findOne("Users", { email: data.email }, { projection: { "_id": 0 } });
    console.log('find login user is: ', user);

    
    if (!user) {//user email not found in db
        res.status(404).json({ message: "User Does Not Exist", statusCode: 404 });
    } else {//user email found in db
        if(req.body.password==user.password){//password match
            res.send({userName: user.userName, email: user.email});
            res.status(200);
        } else {//password NOT match
            res.status(403).json({ message: "Wrong Password", statusCode: 403 });
        }
    }    
});



module.exports = router;