const express = require('express');
const validator = require('express-validator');

const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.get('/reset', authController.getRest);

router.get('/reset/:token', authController.getNewPassword);

router.post('/login', authController.postLogin);

router.post('/logout', authController.postLogout);

router.post(
    '/signup',
    [
        validator.check('email').isEmail().withMessage('Please enter a valid email'),
        validator.check('password').isLength({min: 6}).withMessage('Password length must be at least 6'),
        validator.body('confirmPassword').custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match');
            }
            return true;
        })
    ],
    authController.postSignup
);

router.post('/reset', authController.postReset);

router.post('/new-password', authController.postNewPassword);

module.exports = router;