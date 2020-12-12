const em = require("../utils/email");
const router = require("express").Router();
const crypto = require("crypto");

//model
const userModel = require("../model/userModel");
const postModel = require("../model/postModel");

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

    let user = await userModel.getUser(data.email);

    if (!user) {//user's email not signed up, now sign up with email+password
        userModel.createUser(data);
        em.sendEmail(data.email, "EZCampus Account Verification",
            'Hello,\n\n' + 'Please verify your EZCampus account by clicking the link: \nhttps:\/\/'
            + 'server.metaraw.world' + '\/users\/' + '\/confirmation\/' + data.token + '.\n');
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

    let user = await userModel.getUser(data.email);
    
    if (!user) {//user email not found in db
        res.status(404).json({ statusCode: 404, message: "User Does Not Exist" });
    } else {//user email found in db
        if (req.body.password == user.password) {//password match
            let avatarlink = user.profile ? user.profile.avatarlink : "";
            res.status(200).json({ "statusCode": 200, "user": { "userName": user.userName, "email": user.email, "avatarlink": avatarlink } });
        } else {//password NOT match
            res.status(403).json({ statusCode: 403, message: "Wrong Password"});
        }
    }    
});

router.get("/confirmation/:token", async ({ params: { token } }, res) => {
    let result = await userModel.updateVerify(token, true);
    if (result.matchedCount == 0) {
        res.status(404).send("user not existed!");
    } else {
        res.status(200).send("success");
    }
});

router.get("/resend_verify", async ({ query: { email } }, res) => {
    let user = await userModel.getUser(email.toLowerCase());
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
    let random_code = Math.floor(100000 + Math.random() * 900000); // generate random 6 digit code

    let password_reset = {
        password_reset: {
            verify: false,
            code: random_code,
            expiration_date: Date.now() + 300000 // 5 minutes
        }
    }
    
    let result = await userModel.setUserData(email.toLowerCase(), password_reset);

    if (result.matchedCount == 0) {
        res.status(404).json({ statusCode: 404, message: "user does not exist" });
    } else {
        em.sendEmail(email, "EZCampus Account Password Reset",
            'Hello,\n\n' + 'Your verification code is ' + random_code +'. The code is valid for 5 minutes.\n');
        res.status(200).json({ statusCode: 200, message: "success" });
    }
});

router.get("/forget_password/verify", async ({ query: { codeEmail, code } }, res) => {
    let user = await userModel.getUser(codeEmail.toLowerCase());
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
                let data = { password_reset: new_password_reset };
                await userModel.setUserData(codeEmail.toLowerCase(), data);
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

    let user = await userModel.getUser(data.email);
    if (!user) {
        res.status(404).json({ statusCode: 404, message: "user does not exist" });
    } else {
        if (!user.password_reset.verify) {
            res.status(403).json({ statusCode: 403, message: "not verified" });
        } else {
            let new_password_reset = user.password_reset;
            new_password_reset.verify = false;
            new_password_reset.code = null;
            let newData = { password: data.password, password_reset: new_password_reset };
            await userModel.setUserData(data.email, newData);
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

    let user = await userModel.getUser(data.loginEmail);

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
        
        // since userName is changed, we have to update all the username in posts
        if (req.body.userName) {
            data.userName = req.body.userName;
            let newData = { creatorName: data.userName };
            await postModel.updatePostUserData(data.loginEmail, newData);
        } else {
            data.userName = data.userName;
        }

        // since userName is changed, we have to update all the avatarlink in posts
        if (req.body.avatarlink) {
            data.avatarlink = req.body.avatarlink;
            let newData = { avatarlink: data.avatarlink };
            await postModel.updatePostUserData(data.loginEmail, newData);
        } else {
            data.avatarlink = data.avatarlink;
        }

        data.contactEmail = req.body.contactEmail ? req.body.contactEmail.toLowerCase() : data.contactEmail;
        
        let newData = { profile: data, userName: userName };
        await userModel.setUserData(data.loginEmail, newData);
      
        res.status(200).json({statusCode: 200, message: "success" });
    }
});

router.get("/profile/get", async ({ query: { email, userEmail } }, res) => {
    let user = await userModel.getUser(email.toLowerCase());
    
    let isInContacts = false;

    if (userEmail) {
        let find = await userModel.getContactUser(userEmail, email);
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

    let userMe = await userModel.getUser(data.myEmail);
    let user = await userModel.getUser(data.userEmail);

    if (!userMe){
        res.status(404).json({ statusCode: 404, message: "current user does not exist" });
    }
    else if(!user) {
        res.status(404).json({ statusCode: 404, message: "incoming user does not exist" });
    } else {
        let listlength = userMe.contact ? userMe.contact.length : 0;
        for(let i = 0; i < listlength; i++){
            if(userMe.contact[i].userEmail == data.userEmail){
                res.status(500).json({statusCode: 500, message: "incoming user already added"});
                return;
            }
        }
        let arrayElement = { "userName": user.userName, "userEmail": data.userEmail };
        await userModel.pushArrayElement(data.myEmail, "contact", arrayElement);
        res.status(200).json({statusCode: 200, message: "success" });
    }
});

/* get a user's contact list */
router.get("/contact/get_contactList", async ({ query: { email } }, res) => {
    let user = await userModel.getUser(email.toLowerCase());
    
    if (!user) {
        res.status(404).json({ statusCode: 404, message: "user does not exist" });
    } else if (!user.contact) {
        res.status(500).json({ statusCode: 500, message: "user contact is empty" });
    } else {
        let listlength = user.contact ? user.contact.length : 0;
        let i;
        for (i = 0; i < listlength; i++){ 
            let incomingUser = await userModel.getUser(user.contact[i].userEmail);
            let incomingAvatarlink = incomingUser.profile ? incomingUser.profile.avatarlink : null;
            let incomingUsername = incomingUser.userName? incomingUser.userName : null;
	    user.contact[i].avatarlink = incomingAvatarlink;
	    user.contact[i].userName = incomingUsername;
        }
        res.status(200).json({ statusCode: 200, contact: user.contact });
    }    
});


/* delete a contact*/
router.delete("/contact/delete", async ({query: { myEmail, userEmail }}, res) => {
    myEmail = myEmail.toLowerCase();
    userEmail = userEmail.toLowerCase();
    let userMe = await userModel.getUser(myEmail);
    let user = await userModel.getUser(userEmail);
    if (!userMe){
        res.status(404).json({ statusCode: 404, message: "current user does not exist" });
    } else if (!user) {
        res.status(404).json({ statusCode: 404, message: "incoming user does not exist" });
    } else {
        await userModel.deleteContact(myEmail, userEmail);
        res.status(200).json({statusCode: 200, message: "success"});
    }
});

module.exports = router;  
