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
        res.status(200).json({ statusCode: 200, message: "User Created" });
    } else {
        res.status(403).json({ statusCode: 403, message: "User existed" });
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
        res.status(404).json({ statusCode: 404, message: "User Does Not Exist" });
    } else {//user email found in db
        if (req.body.password == user.password) {//password match
            res.status(200).json({ "statusCode": 200, "user": { "userName": user.userName, "email": user.email } });
        } else {//password NOT match
            res.status(403).json({ statusCode: 403, message: "Wrong Password"});
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

router.get("/forget_password/send_email", async ({ query: { email } }, res) => {
    let user = await db.findOne("Users", { email: email }, { projection: { "_id": 0 } });
    if (!user) {
        res.status(404).json({ statusCode: 404, message: "user does not exist" });
    } else {
        let random_code = Math.floor(100000 + Math.random() * 900000); // generate random 6 digit code

        let password_reset = {
            verify: false,
            code: random_code,
            expiration_date: Date.now() + 300000 // 5 minutes
        }

        await db.updateOne("Users", { email: email }, {$set: {password_reset: password_reset}});
        em.sendEmail(email, "EZCampus Account Password Reset",
            'Hello,\n\n' + 'Your verification code is ' + random_code +'. The code is valid for 5 minutes.\n');
        res.status(200).json({ statusCode: 200, message: "success" });
    }
});

router.get("/forget_password/verify", async ({ query: { codeEmail, code } }, res) => {
    let user = await db.findOne("Users", { email: codeEmail }, { projection: { "_id": 0 } });
    if (!user) {
        res.status(404).json({ statusCode: 404, message: "user does not exist" });
    } else {
        if (user.password_reset.code != code) {
            res.status(403).json({ statusCode: 403, message: "verification code incorrect" });
        } else {
            if (Date.now() > user.password_reset.expiration_date) {
                res.status(408).json({ statusCode: 408, message: "timeout" });
            } else {
                let new_password_reset = user.password_reset;
                new_password_reset.verify = true;
                await db.updateOne("Users", { email: codeEmail }, { $set: { password_reset: new_password_reset } });
                res.status(200).json({ statusCode: 200, message: "success" });
            }
        }
    }
});

router.post("/forget_password/reset_password", async (req, res) => {
    let data;
    data = {
        email: req.body.codeEmail,
        password: req.body.password
    };

    let user = await db.findOne("Users", { email: data.email }, { projection: { "_id": 0 } });
    if (!user) {
        res.status(404).json({ statusCode: 404, message: "user does not exist" });
    } else {
        if (!user.password_reset.verify) {
            res.status(403).json({ statusCode: 403, message: "not verified" });
        } else {
            let new_password_reset = user.password_reset;
            new_password_reset.verify = false;
            new_password_reset.code = null;
            await db.updateOne("Users", { email: data.email }, { $set: { password: data.password, password_reset: new_password_reset } });
            res.status(200).json({ statusCode: 200, message: "success" });
        }
    }
});

module.exports = router;