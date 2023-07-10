const mongoose = require('mongoose');

// Schema constructor
const Schema = mongoose.Schema;

// _id is still added automatically (even when using mongoose)
const productSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        // refer to User model, sets up a relation
        // Product <Created By> User
        ref: 'User',
        required: true
    }
});

// Connects a Schema with a name, here we connect the name 'Product' to productSchema
module.exports = mongoose.model('Product', productSchema);

// const mongodb = require('mongodb');
// const getDb = require('../util/database').getDb;

// class Product {
//     constructor(title, price, description, imageUrl, id, userId) {
//         this.title = title;
//         this.price = price;
//         this.description = description;
//         this.imageUrl = imageUrl;
//         this._id = id ? new mongodb.ObjectId(id) : null;
//         this.userId = userId;
//     }

//     save() {
//         const db = getDb();
//         let dbOp;
//         if (this._id) {
//             // update
//             dbOp = db.collection('products').updateOne({_id: this._id}, {$set: this});
//         } else {
//             dbOp = db.collection('products').insertOne(this);
//         }
//         return dbOp.then(result => {
//             console.log(result);
//         }).catch(err => {
//             console.log(err);
//         });
//     }

//     static fetchAll() {
//         const db = getDb();

//         // .find() returns a cursor, not a promise
//         // cursor lets us go through documents step by step
//         // toArray is costly, better to use 'pagination' when there's many docs (later)
//         return db.collection('products').find().toArray().then(products => {
//             console.log(products);
//             return products;
//         }).catch(err => {
//             console.log(err);
//         });
//     }

//     static findById(prodId) {
//         const db = getDb();

//         //mongodb sotres id's in _id field
//         // also stores them in mongodb.ObjectId()
//         // .next() chained after mongos .find() gets the next doc in the cursor
//         return db.collection('products').find({_id: new mongodb.ObjectId(prodId)}).next().then(product => {
//             console.log(product);
//             return product;
//         }).catch(err => {
//             console.log(err);
//         })
//     }

//     static deleteById(prodId) {
//         const db = getDb();
//         return db.collection('products').deleteOne({_id: new mongodb.ObjectId(prodId)}).then(result => {
//             console.log('Deleted');
//         }).catch(err => {
//             console.log(err);
//         });
//     }
// }

// module.exports = Product;
