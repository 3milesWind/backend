const db = require("../utils/database");
const em = require("../utils/email");
const router = require("express").Router();
const crypto = require("crypto");
const { Server } = require("http");

router.use(require("body-parser").json());

//signup
router.post("/email_register", async (req, res) => { 
    
    let data;
    data = {
        email: req.body.email,
        userName: req.body.userName,
        password: req.body.password,
        verify: false,
        token: crypto.randomBytes(16).toString('hex')
    };
    
    console.log("passin signup data is: ", data);

    let user = await db.findOne("Users", { email: data.email }, { projection: { "_id": 0 } });
    console.log('find signup user is: ', user);

    if (!user) {//user's email not signed up, now sign up with email+password
        db.insertOne("Users", data);
        em.sendEmail(data.email, "EZCampus Account Verification",
            'Hello,\n\n' + 'Please verify your EZCampus account by clicking the link: \nhttp:\/\/'
            + 'server.metaraw.world:3000' + '\/users\/' + '\/confirmation\/' + data.token + '.\n');
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
        if (req.body.password == user.password) {//password match
            res.status(200).json({ "statusCode": 200, "user": { "userName": user.userName, "email": user.email } });
        } else {//password NOT match
            res.status(403).json({ message: "Wrong Password", statusCode: 403 });
        }
    }    
});

router.get("/confirmation/:token", async ({ params: { token } }, res) => {
    let user = await db.findOne("Users", { token: token }, { projection: { "_id": 0 } });
    if (!user) {
        res.status(404).send("user not existed!");
    } else {
        await db.updateOne("Users", { token: token }, { $set: { verify: true } });
        res.status(200).send("success");
    }
});

router.get("/resend_verify", async ({ query: { email } }, res) => {
    let user = await db.findOne("Users", { email: email }, { projection: { "_id": 0 } });
    if (!user) {
        res.status(404).json({ statusCode: 404, message: "user does not exist" });
    } else {
        em.sendEmail(email, "EZCampus Account Verification",
            'Hello,\n\n' + 'Please verify your EZCampus account by clicking the link: \nhttp:\/\/'
            + 'server.metaraw.world:3000' + '\/users\/' + '\/confirmation\/' + user.token + '.\n');
        res.status(200).json({ statusCode: 200, message: "success" });
    }
    
});


module.exports = router;