const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const config = require('../config');
const validator = require('express-validator');

const User = require('../models/user');

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: config.sendGridApiKey
    }
}));

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/login', {
        pageTitle: 'Login',
        path: '/login',
        isAuthenticated: false,
        errorMessage: message,
        oldInput: {email: "", password: ""},
        validationErrors: []
    });
};

exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        errorMessage: message,
        oldInput: { email: "", password: "", confirmPassword: "" },
        validationErrors: []
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    
    // Gather all errors collected by express-validator
    const errors = validator.validationResult(req);
    if(!errors.isEmpty()) {
        console.log(errors.array());
        // 422 common code for invlaid input
        return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: errors.array()[0].msg,
            oldInput: { email: email, password: password },
            validationErrors: errors.array()
        });
    }
    User.findOne({email: email}).then(user => {
        if (!user) {
            console.log('No registerd user with that email!');
            return res.status(422).render('auth/login', {
                path: '/login',
                pageTitle: 'Login',
                errorMessage: 'Invalid email or password',
                oldInput: { email: email, password: password },
                validationErrors: [{ path: 'email' },{ path: 'password' }]
            });
        }
        bcrypt.compare(password, user.password).then(match => {
            if(match) {
                req.session.isLoggedIn = true;
                req.session.user = user;
                return req.session.save(err => {
                    console.log(err);
                    res.redirect('/');
                });
            } else {
                console.log('passwords do not match!');
                return res.status(422).render('auth/login', {
                    path: '/login',
                    pageTitle: 'Login',
                    errorMessage: 'Invalid email or password',
                    oldInput: { email: email, password: password },
                    validationErrors: [{ path: 'email' },{ path: 'password' }]
                });
            }
        }).catch(err => {
            console.log(err);
            res.redirect('/login');
        });
    }).catch(err => console.log(err));

    // User.findById('64a9f275f41d1c743d5c7e0c').then(user => {
    //     // sets a new field to req called user, setting it to user we found
    //     req.session.isLoggedIn = true;
    //     req.session.user = user;
    //     req.session.save(err => {
    //         console.log(err);
    //         res.redirect('/');
    //     });
    // }).catch(err => console.log(err));
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const errors = validator.validationResult(req);
    if(!errors.isEmpty()) {
        console.log(errors.array());
        // 422 common code for invlaid input
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Signup',
            errorMessage: errors.array()[0].msg,
            oldInput: { email: email, password: password, confirmPassword: confirmPassword },
            validationErrors: errors.array()
        });
    }
    bcrypt.hash(password, 12).then(hashedPassword => {
        const user = new User({
            email: email,
            password: hashedPassword,
            cart: { items: [] }
        });
        return user.save();
    }).then(() => {
        res.redirect('/login');
        return transporter.sendMail({
            to: email,
            from: 'shop@node-complete.com',
            subject: 'Signup Succeeded!',
            html: '<h1>You successfully signed up!</h1>'
        }).catch(err => console.log(err));
    });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        console.log(err);
        res.redirect('/');
    });
};

exports.getRest = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/reset', {
        pageTitle: 'Reset Password',
        path: '/reset',
        isAuthenticated: false,
        errorMessage: message 
    });
};

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({email : req.body.email}).then(user => {
            if (!user) {
                req.flash('error', 'No registered user with that email');
                return res.redirect('/reset');
            }
            user.resetToken = token;
            user.resetTokenExpiration = Date.now() + 3600000;
            return user.save();
        }).then(user => {
            res.redirect('/');
            return transporter.sendMail({
                to: user.email,
                from: 'shop@node-complete.com',
                subject: 'Password Reset',
                html: `
                    <p>You requested a password reset</p>
                    <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password</p>
                `
            });
        }).catch(err => console.log(err));
    })
};

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({requestToken: token, resetTokenExpiration: {$gt: Date.now()}}).then(user => {
        if(!user) {
            return res.redirect('/');
        }
        let message = req.flash('error');
        if (message.length > 0) {
            message = message[0];
        } else {
            message = null;
        }
        res.render('auth/new-password', {
            pageTitle: 'New Password',
            path: '/new-password',
            isAuthenticated: false,
            errorMessage: message,
            userId: user._id.toString(),
            passwordToken: token
        });
    }).catch(err => console.log(err));
};

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let user;

    User.findOne(
        {
            _id: userId,
            resetToken: passwordToken,
            resetTokenExpiration: {$gt: Date.now()}
        }).then(foundUser => {
            user = foundUser;
            return bcrypt.hash(newPassword, 12);
        }).then(hashedPassword => {
            user.password = hashedPassword;
            user.resetToken = undefined;
            user.resetTokenExpiration = undefined;
            return user.save();
        }).then(() => {
            res.redirect('/login');
        }).catch(err => console.log(err));
};