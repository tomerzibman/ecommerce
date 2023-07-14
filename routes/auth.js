const express = require('express');
const { check, body } = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.get('/reset', authController.getRest);

router.get('/reset/:token', authController.getNewPassword);

router.post(
    '/login',
    [
        body('email')
            .isEmail()
            .withMessage('Not a valid E-mail')
            .normalizeEmail(),
        body('password')
            .isLength({min: 6})
            .withMessage('Password must be of length at least 6')
            .trim()
    ],
    authController.postLogin
);

router.post('/logout', authController.postLogout);

router.post(
    '/signup',
    [
        check('email')
            .isEmail()
            .withMessage('Please enter a valid email')
            .custom((value, { req }) => {
                return User.findOne({email: value}).then(user => {
                    if(user) {
                        console.log('Email already exists!');
                        return Promise.reject('Email already exists, please pick a different one');
                    }
                });
            })
            .normalizeEmail(),
        body('password')
            .isLength({min: 6})
            .withMessage('Password length must be at least 6')
            .trim(),
        body('confirmPassword')
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Passwords do not match');
                }
                return true;
            })
            .trim()
    ],
    authController.postSignup
);

router.post('/reset', authController.postReset);

router.post('/new-password', authController.postNewPassword);

module.exports = router;