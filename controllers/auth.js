const bcrypt = require('bcryptjs');

const User = require('../models/user');

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
    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup'
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({email: email}).then(user => {
        if (!user) {
            console.log('No registerd user with that email!');
            req.flash('error', 'Invalid email');
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
        }).catch(err => console.log(err));
    });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        console.log(err);
        res.redirect('/');
    });
};