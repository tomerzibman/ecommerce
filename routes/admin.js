const express = require('express');
const { check, body } = require('express-validator');

const path = require('path');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get('/products', isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product', isAuth, [
    body('title')
        .notEmpty().withMessage("Title cannot be empty")
        .isString()
        .trim(),
    body('price')
        .notEmpty().withMessage("Price should not be empty")
        .isFloat().withMessage("Price should be a decimal number"),
    body('description')
        .notEmpty().withMessage("Description cannot be empty")
        .trim(),
    body('imageUrl')
        .notEmpty().withMessage("Image URL cannot be empty")
        //.isURL().withMessage("Image URL must be a valid URL")
], adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product', isAuth, [
    body('title')
        .notEmpty().withMessage("Title cannot be empty")
        .isString()
        .trim(),
    body('price')
        .notEmpty().withMessage("Price cannot be empty")
        .isFloat().withMessage("Price must be a number"),
    body('description')
        .notEmpty().withMessage("Description cannot be empty")
        .trim(),
    body('imageUrl')
        .notEmpty().withMessage("Image URL cannot be empty")
        //.isURL().withMessage("Image URL must be a valid URL")
], adminController.postEditProduct);

router.post('/delete-product', isAuth, adminController.postDeleteProduct);

module.exports = router;