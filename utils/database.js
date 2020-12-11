const { MongoClient, ObjectId } = require('mongodb');

const DATABASE_URL = "mongodb://localhost:27017";
const DATABASE_NAME = "EZCampus";

let db;

async function connect() {
    let connection = await MongoClient.connect(DATABASE_URL, { useUnifiedTopology: true });
    db = connection.db(DATABASE_NAME);
}

async function setnewDate() {
    db.collection("Posts").find({}, {}).forEach(async (doc) => {
        let dateObj = new Date(doc.date);
        console.log(dateObj);
	await db.collection("Posts").updateOne({"postId": doc.postId}, {$set: {"dateObj": dateObj}});
    });
    return;
}

connect();

module.exports = {

    find: async function (collection, querySelector, queryOptions, sortOptions) {
        try {
//	    await setnewDate();
            return await db.collection(collection).find(querySelector, queryOptions).sort(sortOptions).toArray();
        } catch (e) {
            throw Error(e);
        }
    },

    findOne: async function (collection, querySelector, queryOptions) {
        try {
            return await db.collection(collection).findOne(querySelector, queryOptions);
        } catch (e) {
            throw Error(e);
        }
    },

    findOneAndUpdate: async function (collection, querySelector, updateData, queryAndUpdateOptions) {
        try {
            return await db.collection(collection).findOneAndUpdate(querySelector, queryOptions, queryAndUpdateOptions);
        } catch (e) {
            throw Error(e);
        }
    },

    updateOne: async function (collection, querySelector, updateData) {
        try {
            return await db.collection(collection).updateOne(querySelector, updateData);
        } catch (e) {
            throw Error(e);
        }
    },

    updateMany: async function (collection, querySelector, updateData) {
        try {
            return await db.collection(collection).updateMany(querySelector, updateData);
        } catch (e) {
            throw Error(e);
        }
    },

    insertOne: async function (collection, insertionData) {
        try {
            return await db.collection(collection).insertOne(insertionData);
        } catch (e) {
            throw Error(e);
        }
    },

    insertMany: async function (collection, insertionData) {
        try {
            return await db.collection(collection).insertMany(insertionData);
        } catch {
            throw Error(e);
        }
    },

    deleteOne: async function (collection, querySelector) {
        try {
            return await db.collection(collection).deleteOne(querySelector);
        } catch {
            throw Error(e);
        }
    }
}
