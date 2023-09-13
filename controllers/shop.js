const fs = require('fs');
const path = require('path');
const config = require('../config');
const stripe = require('stripe')(config.stripeSecretKey);

const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');
const product = require('../models/product');

const ITEMS_PER_PAGE = 2;

exports.getIndex = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalProducts = 0;

    Product.find().countDocuments().then(numProducts => {
        totalProducts = numProducts;
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
    let totalProducts = 0;

    Product.find().countDocuments().then(numProducts => {
        totalProducts = numProducts;
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
};

exports.getCheckout = (req, res, next) => {
    let products;
    let totalPrice = 0;
    req.user.populate('cart.items.productId').then(user => {
        products = user.cart.items;
        totalPrice = 0;
        products.forEach(item => {
            totalPrice += item.productId.price * item.quantity;
        });

        return stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: products.map(p => {
                return {
                    price_data: {
                        unit_amount: p.productId.price * 100,
                        currency: 'cad',
                        product_data: {
                            name: p.productId.title,
                            description: p.productId.description
                        }
                    },
                    quantity: p.quantity
                };
            }),
            success_url: req.protocol + '://' + req.get('host') + '/checkout/success',
            cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
        });
    }).then(session => {
        res.render('shop/checkout', {
            pageTitle: 'Checkout', 
            path: '/checkout',
            products: products,
            totalPrice: totalPrice,
            sessionId: session.id
        });
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
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
};

exports.postOrder = (req, res, next) => {
    req.user.populate('cart.items.productId').then(user => {
        const products = req.user.cart.items.map(item => {
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
    }).catch(err => next(err));
};

