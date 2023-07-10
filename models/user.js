const mongoose = require('mongoose');
const Order = require('./order');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    cart: {
        items: [{
            // refer to some Product id, User will have some products in their cart
            productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true }, 
            quantity: { type: Number, required: true }
        }]
    }
});

userSchema.methods.addToCart = function(product) {
    const cartProductIndex = this.cart.items.findIndex(cp => {
        return cp.productId.toString() === product._id.toString();
    });
    
    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items];
    
    if (cartProductIndex >= 0) {
        newQuantity = this.cart.items[cartProductIndex].quantity + 1;
        updatedCartItems[cartProductIndex].quantity = newQuantity;
    } else {
        updatedCartItems.push({productId: product._id, quantity: newQuantity});
    }

    const updatedCart = {items: updatedCartItems};
    this.cart = updatedCart;
    return this.save();
}

userSchema.methods.deleteItemFromCart = function(productId) {
    const cartProductIndex = this.cart.items.findIndex(item => {return item.productId.toString() === productId.toString()});
    if (cartProductIndex < 0) {
        return;
    }
    let updatedCartItems;
    if (this.cart.items[cartProductIndex].quantity <= 1) {
        updatedCartItems = this.cart.items.filter(item => {
            return item.productId.toString() !== productId.toString();
        });
    } else {
        updatedCartItems = [...this.cart.items];
        updatedCartItems[cartProductIndex].quantity -= 1;
    }
    this.cart.items = updatedCartItems;
    return this.save();
}

userSchema.methods.clearCart = function() {
    this.cart = {items: []};
    return this.save();
}

// userSchema.methods.addOrder = function() {
//     const order = new Order({
//         items: this.cart.items,
//         userId: this._id
//     });
//     return order.save().then(() => {
//         this.cart.items = [];
//         return this.save();
//     }).catch(err => console.log(err));
// }

// userSchema.methods.getOrders = function() {
//     return Order.find({ userId: this._id }).populate('items.productId');
// }

module.exports = mongoose.model('User', userSchema);

// const mongodb = require('mongodb');
// const getDb = require('../util/database').getDb;

// const ObjectId = mongodb.ObjectId;

// class User {
//     constructor(username, email, cart, id) {
//         this.name = username;
//         this.email = email;
//         this.cart = cart; // {items: []}
//         this._id = id;
//     }

//     save() {
//         const db = getDb();
//         return db.collection('users').insertOne(this);
//     }

//     addToCart(product) {
//         if (!this.cart) {
//             this.cart = {items: []};
//         }
//         const cartProductIndex = this.cart.items.findIndex(cp => {
//             return cp.productId.toString() === product._id.toString();
//         });
        
//         let newQuantity = 1;
//         const updatedCartItems = [...this.cart.items];
        
//         if (cartProductIndex >= 0) {
//             newQuantity = this.cart.items[cartProductIndex].quantity + 1;
//             updatedCartItems[cartProductIndex].quantity = newQuantity;
//         } else {
//             updatedCartItems.push({productId: new ObjectId(product._id), quantity: newQuantity});
//         }

//         const updatedCart = {items: updatedCartItems};
//         const db = getDb();
//         return db.collection('users').updateOne({_id: new ObjectId(this._id)}, {$set: {cart: updatedCart}});
//     }

//     getCart() {
//         const db = getDb();
//         const productIds = this.cart.items.map(item => {return item.productId});
//         return db.collection('products').find({_id: {$in: productIds}}).toArray().then(products => {
//             return products.map(product => {
//                 return {...product, quantity: this.cart.items.find(item => {return item.productId.toString() === product._id.toString()}).quantity}
//             })
//         });
//     }

//     deleteItemFromCart(productId) {
//         const cartProductIndex = this.cart.items.findIndex(item => {return item.productId.toString() === productId.toString()});
//         if (cartProductIndex < 0) {
//             return;
//         }
//         let updatedCartItems;
//         if (this.cart.items[cartProductIndex].quantity <= 1) {
//             updatedCartItems = this.cart.items.filter(item => {
//                 return item.productId.toString() !== productId.toString();
//             });
//         } else {
//             updatedCartItems = [...this.cart.items];
//             updatedCartItems[cartProductIndex].quantity -= 1;
//         }
//         const updatedCart = {items: updatedCartItems};
//         const db = getDb();
//         return db.collection('users').updateOne({_id: new ObjectId(this._id)}, {$set: {cart: updatedCart}});
//     }

//     addOrder() {
//         const db = getDb();
//         return this.getCart().then(products => {
//             const order = {
//                 items: products,
//                 user: {
//                     _id: new ObjectId(this._id),
//                     name: this.name
//                 }
//             };
//             return db.collection('orders').insertOne(order);
//         }).then(result => {
//             this.cart = {items: []};
//             return db.collection('users').updateOne({_id: new ObjectId(this._id)}, {$set: {cart: {items: []}}});
//         });
//     }

//     getOrders() {
//         const db = getDb();
//         return db.collection('orders').find({'user._id': new ObjectId(this._id)}).toArray();
//     }

//     static findById(userId) {
//         const db = getDb();
//         return db.collection('users').findOne({_id: new ObjectId(userId)}).then(user => {
//             return user;
//         }).catch(err => {
//             console.log(err);
//         });
//     }
// }

// module.exports = User;