const { MongoClient, ObjectId } = require('mongodb');

const DATABASE_URL = "mongodb://localhost:27017";
const DATABASE_NAME = "EZCampus";

let db;

async function connect() {
    let connection = await MongoClient.connect(DATABASE_URL);
    db = connection.db(DATABASE_NAME);
}

// connect();

module.exports = {

    find: async function (collection, querySelector, queryOptions) {
        try {
            return await db.collection(collection).find(querySelector, queryOptions).toArray();
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

    updateOne: async function (collection, querySelector, updateData, updateOptions) {
        try {
            return await db.collection(collection).updateOne(querySelector, queryOptions, updateOptions);
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

    deleteOne: async function(collection, querySelector) {
        try {
            return await db.collection(collection).remove(querySelector, { justOne: true });
        } catch {
            throw Error(e);
        }
    }
}
