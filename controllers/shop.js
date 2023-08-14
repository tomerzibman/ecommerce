const fs = require('fs');
const path = require('path')

const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');
const product = require('../models/product');
// const mongoose = require('mongoose');

const ITEMS_PER_PAGE = 2;

exports.getIndex = (req, res, next) => {
    const page = +req.query.page || 1;
    console.log(page+1);
    let totalProducts = 0;

    Product.find().countDocuments().then(numProducts => {
        totalProducts = numProducts;
        // .find() in mongoose gives all docs in collection
        return Product.find().skip((page - 1)*ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE);
    }).then(products => {
        res.render('shop/index', {
            prods: products, 
            pageTitle: 'Shop', 
            path: '/',
            page: page,
            hasNextPage: ITEMS_PER_PAGE * page < totalProducts,
            hasPrevPage: page > 1,
            nextPage: page + 1,
            prevPage: page - 1,
            lastPage: Math.ceil(totalProducts / ITEMS_PER_PAGE)
        });
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    console.log(page+1);
    let totalProducts = 0;

    Product.find().countDocuments().then(numProducts => {
        totalProducts = numProducts;
        // .find() in mongoose gives all docs in collection
        return Product.find().skip((page - 1)*ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE);
    }).then(products => {
        res.render('shop/product-list', {
            prods: products, 
            pageTitle: 'Products', 
            path: '/products',
            page: page,
            hasNextPage: ITEMS_PER_PAGE * page < totalProducts,
            hasPrevPage: page > 1,
            nextPage: page + 1,
            prevPage: page - 1,
            lastPage: Math.ceil(totalProducts / ITEMS_PER_PAGE)
        });
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
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
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.getCart = (req, res, next) => {
    req.user.populate('cart.items.productId').then(user => {
        const products = user.cart.items;
        res.render('shop/cart', {
            pageTitle: 'Your Cart', 
            path: '/cart',
            products: products
        });
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId).then(product => {
        return req.user.addToCart(product);
    }).then(result => {
        res.redirect('/cart');
        console.log(result);
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);;
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
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
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
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
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
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
    // req.user.addOrder().then(result => {
    //     res.redirect('/orders');
    // }).catch(err => console.log(err));
};

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    Order.findById(orderId).then(order => {
        if (!order) {
            return next(new Error('No order found'));
        }
        if (order.user.userId.toString() !== req.user._id.toString()) {
            return next(new Error('Unauthorized'));
        }
        const invoiceName = 'invoice-' + orderId + '.pdf';
        const invoicePath = path.join('data', 'invoices', invoiceName);

        const pdfDoc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
        pdfDoc.pipe(fs.createWriteStream(invoicePath));
        pdfDoc.pipe(res);

        pdfDoc.fontSize(26).text('Invoice', {underline: true});
        pdfDoc.text('---------------------');
        let total = 0;
        order.products.forEach(item => {
            pdfDoc.fontSize(14).text(item.product.title + ' - ' + item.quantity + ' x $' + item.product.price);
            total += item.product.price * item.quantity;
        });
        pdfDoc.fontSize(24).text('---------------------');
        pdfDoc.fontSize(14).text('Total: $' + total);

        pdfDoc.end();
        // fs.readFile(invoicePath, (err, data) => {
        //     if (err){
        //         return next();
        //     }
        //     res.setHeader('Content-Type', 'application/pdf');
        //     res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
        //     res.send(data);
        // });
        // const file = fs.createReadStream(invoicePath);
        
        // file.pipe(res);
    }).catch(err => next(err));
};

