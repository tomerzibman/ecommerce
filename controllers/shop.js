const Product = require('../models/product');
const Order = require('../models/order');
const mongoose = require('mongoose');

exports.getIndex = (req, res, next) => {
    // .find() in mongoose gives all docs in collection
    Product.find().then(products => {
        res.render('shop/index', {
            prods: products, 
            pageTitle: 'Shop', 
            path: '/'
        });
    }).catch(err => console.log(err));
};

exports.getProducts = (req, res, next) => {
    Product.find().then(products => {
        res.render('shop/product-list', {
            prods: products, 
            pageTitle: 'All Products', 
            path: '/products'
        });
    }).catch(err => console.log(err));
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    // Note: findByPk gives only one item, not in a list
    // mongoose has findById method, can pass a string and it will convert it to an ObjectId for us
    Product.findById(prodId).then((product) => {
        res.render('shop/product-detail', {
            product: product, 
            pageTitle: "Product Detail", 
            path: "/products"
        });
    }).catch(err => console.log(err));
};

exports.getCart = (req, res, next) => {
    req.user.populate('cart.items.productId').then(user => {
        const products = user.cart.items;
        res.render('shop/cart', {
            pageTitle: 'Your Cart', 
            path: '/cart',
            products: products
        });
    }).catch(err => console.log(err));
};

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId).then(product => {
        return req.user.addToCart(product);
    }).then(result => {
        res.redirect('/cart');
        console.log(result);
    }).catch(err => {
        console.log(err);
    });
    // let fetchedCart;
    // let newQty = 1;
    // req.user.getCart().then(cart => {
    //     fetchedCart = cart;
    //     return cart.getProducts({where: {id: prodId}});
    // }).then(products => {
    //     let product;
    //     if (products.length > 0) {
    //         product = products[0];
    //     }
    //     if (product) {
    //         newQty = product.cartItem.quantity + 1;
    //         return product;
    //     }
    //     return Product.findByPk(prodId);
    // }).then(product => {
    //     return fetchedCart.addProduct(product, {through: {quantity: newQty}});
    // }).then(() => {
    //     res.redirect('/cart');
    // }).catch(err => console.log(err));
};

exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    req.user.deleteItemFromCart(prodId).then(() => {
        res.redirect('/cart');
    }).catch(err => {
        console.log(err);
    });
    
    // req.user.getCart().then(cart => {
    //     return cart.getProducts({where: {id: prodId}});
    // }).then(products => {
    //     const product = products[0];
    //     return product.cartItem.destroy();
    // }).then(result => {
    //     res.redirect('/cart');
    // }).catch(err => console.log(err));
};

exports.getOrders = (req, res, next) => {
    Order.find({ 'user.userId':req.user._id }).then(orders => {
        res.render('shop/orders', {
            pageTitle: 'Your Orders',
            path: '/orders',
            orders: orders
        });
    }).catch(err => console.log(err));
    // include gets the related products to each order in .products
    // works since we have a realation b/w Order and Product
    // req.user.getOrders().then(orders => {
    //     res.render('shop/orders', {
    //         pageTitle: 'Your Orders', 
    //         path: '/orders',
    //         orders: orders
    //     });
    // }).catch(err => console.log(err));
};

exports.postOrder = (req, res, next) => {
    req.user.populate('cart.items.productId').then(user => {
        const products = req.user.cart.items.map(item => {
            // even though we populated productId, we need to do _doc and spread to store full product data in db
            return { product: { ...item.productId._doc }, quantity: item.quantity };
        });
        const order = new Order({
            products: products,
            user: {
                email: req.user.email,
                userId: req.user._id
            }
        });
        return order.save();
    }).then(() => {
        return req.user.clearCart();
    }).then(() => {
        res.redirect('/orders');
    }).catch(err => console.log(err));
    // req.user.addOrder().then(result => {
    //     res.redirect('/orders');
    // }).catch(err => console.log(err));
};


