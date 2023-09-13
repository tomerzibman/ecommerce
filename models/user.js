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
    resetToken: String,
    resetTokenExpiration: Date,
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

module.exports = mongoose.model('User', userSchema);
