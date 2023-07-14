const Product = require('../models/product');
const validator = require('express-validator');

// Data fetching with mongoose:
// SELECTING: we can do Product.find().select('title price -_id') to retireive all products but only
// select feilds title and price, explicitly excluding _id (_id always gets included unless explicitly exluded)
// POPULATING: we can do Product.find().populate('userId', 'name'), and this will put the user document inside the userId
// feild, instead of just the _id. The second argument corresponds to select as explained above

exports.getAddProduct = (req, res, next) => {
    // Sets header automaically (deafult is res.setHeader('Content-Type', 'text/html');)
    //res.sendFile(path.join(rootDir, 'views', 'add-product.html'));
    res.render('admin/edit-product', {
        pageTitle: 'Add Product', 
        path: '/admin/add-product',
        editing: false
    });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const imageUrl = req.body.imageUrl;
    const price = req.body.price;
    const description = req.body.description;
    // This is a mongoose Schema object, we pass args for fields in js object (left side of colon refers to keys defined in Schema, right side are values)
    const product = new Product({title: title, price: price, description: description, imageUrl: imageUrl, userId: req.user._id});
    // mongoose gives us a save() method we can call
    // technically not a promise but it does give .then() and .catch() methods we can use in the same way
    product.save().then(result => {
        console.log('Created Product');
        res.redirect('/admin/products');
    }).catch(err => {
        console.log(err);
    });
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if (!editMode) {
        console.log('not in edit mode');
        return res.redirect('/');
    }
    const pid = req.params.productId;
    Product.findById(pid).then(product => {
        if(!product) {
            return res.redirect('/');
        }
        res.render('admin/edit-product', {
            pageTitle: 'Edit Product', 
            path: '/admin/edit-product',
            editing: editMode,
            product: product
        });
    }).catch(err => console.log(err));
};

exports.postEditProduct = (req, res, next) => {
    // returning a promise in a .then() will let you chain another .then() with the returned promise
    // only need one .catch(), it will catch errors from any .then()
    const id = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedImageUrl = req.body.imageUrl;
    const updatedPrice = req.body.price;
    const updatedDescription = req.body.description;

    Product.findById(id).then(product => {
        if(product.userId.toString() !== req.user._id.toString()) {
            return res.redirect('/');
        }
        product.title = updatedTitle;
        product.price = updatedPrice;
        product.description = updatedDescription;
        product.imageUrl = updatedImageUrl;
        return product.save().then(result => {
            console.log('UPDATED PRODUCT');
            res.redirect('/admin/products');
        });
    }).catch(err => console.log(err));
};

exports.getProducts = (req, res, next) => {
    Product.find({userId: req.user._id}).then(products => {
        res.render('admin/products', {
            prods: products,
            pageTitle: 'Admin Products',
            path: '/admin/products'
        });
    }).catch(err => {
        console.log(err);
    });
};

exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    if(!prodId) {
        return res.redirect('/admin/products');
    }
    Product.deleteOne({_id: prodId, userId: req.user._id}).then(() => {
        console.log("DESTORYED PRODUCT");
        return res.redirect('/admin/products');
    }).catch(err => console.log(err));
    return res.redirect('/admin/products');
};