const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const config = require('../config');

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
        errorMessage: message
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
        errorMessage: message
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({email: email}).then(user => {
        if (!user) {
            console.log('No registerd user with that email!');
            req.flash('error', 'Invalid email or password');
            return res.redirect('/login');
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
                req.flash('error', 'Invalid email or password');
                res.redirect('/login');
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
    User.findOne({email: email}).then(userDoc => {
        if(userDoc) {
            console.log('Email already exists!');
            req.flash('error', 'Email already exits, please pick another one');
            return res.redirect('/signup');
        }
        return bcrypt.hash(password, 12).then(hashedPassword => {
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