const db = require("../utils/database");

module.exports = {
    createUser: async function (data) {
        return await db.insertOne("Users", data);
    },

    setUserData: async function (email, data) {
        return await db.updateOne("Users", { email: email }, { $set: data });
    },

    pushArrayElement: async function (email, arrayName, data) {
        return await db.updateOne("Users", { email: email }, { $push: { [arrayName]: data } });
    },
    
    getUser: async function (email) {
        return await db.findOne("Users", { email: email }, {});
    },

    // find out if the profile's owner is the login user's contact or not
    getContactUser: async function (loginEmail, profileEmail) {
        return await db.findOne("Users",
            {
                email: loginEmail,
                contact: { $elemMatch: { userEmail: profileEmail.toLowerCase() } }
            }, { projection: { contact: 1 } });
    },

    updateVerify: async function (token, verify) {
        return await db.updateOne("Users", { token: token }, { $set: { verify: verify } });
    },

    deleteContact: async function (myEmail, contactEmail) {
        return await db.updateOne("Users", { email: myEmail }, { $pull: { "contact": { "userEmail": contactEmail } } });
    }

    
}
