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
        email: req.body.email.toLowerCase(),
        userName: req.body.userName,
        password: req.body.password,
        verify: false,
        token: crypto.randomBytes(16).toString('hex')
    };
    
    // console.log("passin signup data is: ", data);

    let user = await db.findOne("Users", { email: data.email }, { projection: { "_id": 0 } });
    // console.log('find signup user is: ', user);

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
        email: req.body.email.toLowerCase(),
        password: req.body.password
    };
    // console.log("passin login data is: ", data);
    let user = await db.findOne("Users", { email: data.email }, { projection: { "_id": 0 } });
    // console.log('find login user is: ', user);

    
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
    let user = await db.findOne("Users", { email: email.toLowerCase() }, { projection: { "_id": 0 } });
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
    let user = await db.findOne("Users", { email: email.toLowerCase() }, { projection: { "_id": 0 } });
    if (!user) {
        res.status(404).json({ statusCode: 404, message: "user does not exist" });
    } else {
        let random_code = Math.floor(100000 + Math.random() * 900000); // generate random 6 digit code

        let password_reset = {
            verify: false,
            code: random_code,
            expiration_date: Date.now() + 300000 // 5 minutes
        }

        await db.updateOne("Users", { email: email.toLowerCase() }, {$set: {password_reset: password_reset}});
        em.sendEmail(email, "EZCampus Account Password Reset",
            'Hello,\n\n' + 'Your verification code is ' + random_code +'. The code is valid for 5 minutes.\n');
        res.status(200).json({ statusCode: 200, message: "success" });
    }
});

router.get("/forget_password/verify", async ({ query: { codeEmail, code } }, res) => {
    let user = await db.findOne("Users", { email: codeEmail.toLowerCase() }, { projection: { "_id": 0 } });
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
                await db.updateOne("Users", { email: codeEmail.toLowerCase() }, { $set: { password_reset: new_password_reset } });
                res.status(200).json({ statusCode: 200, message: "success" });
            }
        }
    }
});

router.post("/forget_password/reset_password", async (req, res) => {
    let data;
    data = {
        email: req.body.codeEmail.toLowerCase(),
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

// save or update existing user profile
// login Email is REQUIRED
router.post("/profile/save", async (req, res) => {
    let data = {
        "city": req.body.city,
        "state": req.body.state,
        "loginEmail": req.body.loginEmail.toLowerCase(), // required
        "contactEmail": req.body.contactEmail,
        "phone": req.body.phone,
        "aboutMe": req.body.aboutMe,
        "avatarlink": req.body.avatarlink

    };
    let userName = req.body.userName;

    let user = await db.findOne("Users", { email: data.loginEmail }, { projection: { "profile": 1, "userName": 1 } });

    if (!user) {
        res.status(404).json({ statusCode: 404, message: "user does not exist" });
    } else {
        // update if provided
        if (user.profile) {
            data = user.profile;
            userName = req.body.userName ? req.body.userName : data.userName;
            data.city = req.body.city ? req.body.city : data.city;
            data.state = req.body.state ? req.body.state : data.state;
            data.phone = req.body.state ? req.body.phone : data.phone;
            data.aboutMe = req.body.state ? req.body.aboutMe : data.aboutMe;
            data.avatarlink = req.body.avatarlink ? req.body.avatarlink : data.avatarlink;
        }
        
        if (req.body.userName) {
            data.userName = req.body.userName;
            await db.updateMany("Posts", { creatorEmail: data.loginEmail }, { $set: { creatorName: data.userName } });
        } else {
            data.userName = data.userName;
        }

        if (req.body.avatarlink) {
            data.avatarlink = req.body.avatarlink;
            await db.updateMany("Posts", { creatorEmail: data.loginEmail }, { $set: { avatarlink: data.avatarlink } });
        } else {
            data.avatarlink = data.avatarlink;
        }

        data.contactEmail = req.body.contactEmail ? req.body.contactEmail.toLowerCase() : data.contactEmail;
      
        await db.updateOne("Users", { email: data.loginEmail }, { $set: { profile: data, userName: userName } });
      
        res.status(200).json({statusCode: 200, message: "success" });
    }
});

router.get("/profile/get", async ({ query: { email, userEmail } }, res) => {
    let user = await db.findOne("Users", { email: email.toLowerCase() }, { projection: { "email": 1, "profile": 1, "userName": 1 } });

    let isInContacts = false;

    if (userEmail) {
        let find = await db.findOne("Users", { email: userEmail, contact: { $elemMatch: { userEmail: email.toLowerCase() } } }, { projection: { contact: 1 } });
        isInContacts = find ? true : false;
    }

    if (!user) {
        res.status(404).json({ statusCode: 404, message: "user does not exist" });
    } else if (!user.profile) {
        res.status(500).json({ statusCode: 500, message: "user profile is empty", isInContacts: isInContacts });
    } else {
        user.profile.userName = user.userName;
        res.status(200).json({ statusCode: 200, profile: user.profile, isInContacts: isInContacts });
    }
});

/* add a contact*/
router.post("/contact/add_a_contact", async (req, res) => {
    let data = req.body;
    data.myEmail = data.myEmail.toLowerCase();
    data.userEmail = data.userEmail.toLowerCase();

    let userMe = await db.findOne("Users", {email: data.myEmail}, { projection: { "_id": 0 } });
    let user = await db.findOne("Users", {email: data.userEmail}, { projection: { "_id": 0 } });
    if (!userMe){
        res.status(404).json({ statusCode: 404, message: "current user does not exist" });
    }
    else if(!user) {
        res.status(404).json({ statusCode: 404, message: "incoming user does not exist" });
    } else {       
        await db.updateOne("Users", { email: data.myEmail }, { $push: {contact: {"userName": user.userName, "userEmail": data.userEmail}} });
        res.status(200).json({statusCode: 200, message: "success" });
    }
});

/* get a user's contact list */
router.get("/contact/get_contactList", async ({ query: { email } }, res) => {
    let user = await db.findOne("Users", { email: email.toLowerCase() }, { projection: { "email": 1, "contact": 1, "profile": 1 } });
    if (!user) {
        res.status(404).json({ statusCode: 404, message: "user does not exist" });
    } else if (!user.contact) {
        console.log("user's contactList empty");
        res.status(500).json({ statusCode: 500, message: "user contact is empty" });
    } else {
        for(i = 0; i < user.contact.length; i++){      
            let incomingUser = await db.findOne("Users", {email: user.contact[i].userEmail}, { projection: { "email": 1, "profile": 1, "_id": 0 } });
            // console.log("incominguser: ", incomingUser);
            console.log(incomingUser.profile.avatarlink);
            console.log("user contact: ",user.contact[i]);
            user.contact[i].avatarlink = incomingUser.profile.avatarlink;
        }
        res.status(200).json({ statusCode: 200, contact: user.contact });
    }    
});


/* delete a contact*/
router.delete("/contact/delete", async ({query: { myEmail, userEmail }}, res) => {
    myEmail = myEmail.toLowerCase();
    userEmail = userEmail.toLowerCase();
    let userMe = await db.findOne("Users", {email: myEmail}, { projection: { "_id": 0 } });
    let user = await db.findOne("Users", {email: userEmail}, { projection: { "_id": 0 } });
    if (!userMe){
        res.status(404).json({ statusCode: 404, message: "current user does not exist" });
    } else if (!user) {
        res.status(404).json({ statusCode: 404, message: "incoming user does not exist" });
    } else {
        await db.updateOne("Users", {email: myEmail}, {$pull: {"contact": {"userEmail": userEmail}}});
        res.status(200).json({statusCode: 200, message: "success"});
    }
});

module.exports = router;  