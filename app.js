const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
// const expressHbs = require('express-handlebars');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const errorController = require('./controllers/error');
//const mongoConnect = require('./util/database').mongoConnect;
const User = require('./models/user');

const config = require('./config');

const MONGODB_URI = 'mongodb+srv://Tomer:snwtkgIDbTgvjiR2@cluster0.7bkvtlq.mongodb.net/shop?retryWrites=true&w=majority';

// Express exports a function, so we execute it as one
// This initializes a new object, where express.js stores and manages things for us behind the scenes
// 'app' is also a valid Request Handler we can pass to createServer
// Have not defined any logic for incoming requests yet
const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});
const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // multer calls function to know how to store it
        // cb provided by multer. First arg is error msg (null => okay to store)
        // 2nd arg is place where we want
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        // first arg same as above, second is filename
        // file.filename is random hash
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'){
        cb(null, true);
    } else {
        cb(null, false);
    }
}

// Registers a new template engine incase for when it isnt already built-in to express
// expressHbs() returns the initialized view engine, that gets assigned to engine (name handlebars)
// app.engine('hbs', expressHbs({layoutsDir: 'views/layouts/', defaultLayout: 'main-layout', extname: 'hbs'}));

// app.set() allows us to set any values globally on our express app
// app.set('view engine', 'pug');
// app.set('view engine', 'hbs');
// the render method looks for the regiserted view engine
app.set('view engine', 'ejs');
app.set('views', 'views');

// Allowes us to add a middlewhere functions
// Accepts an array of Request Handlers
// Must call next() at the end of the middleware to continue to the next middlewear
// The next middleware is going to call the next app.use function we make
// If there is no next you should return a response
// First argument is path filter, like url filter (will run first use function that matches path)


// Executing a query with execute on our pool
// .then() and .catch() are promise functions it has
// .then() is instad of having a cb function as a second argument to execute
// .catch execute in case of an error (ex. db connection fails)


// Function we must execute (can pass options to configure it)
// This registers a middleware (passes a function even though we can see it),
// it calls next in the end to the request also reaches our middlware,
// but before it does that it does the whole request body parsing we had to do manually before
app.use(bodyParser.urlencoded({extended: false}));
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'));

// Lets us serve files statically (not handled by express router), direcly forwarded to the file system
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: store
}));
app.use(csrfProtection);
app.use((req, res, next) => {
    // res.locals allows us to set local variables that are passed into the views
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use(flash());

app.use((req, res, next) => {
    if(!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id).then(user => {
        if(!user) {
            return next();
        }
        // sets a new field to req called user, setting it to user we found
        req.user = user;
        next();
    }).catch(err => {
        next(new Error(err));
    });
});

// '/admin' is a path such that all routes from admin start with /admin
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);
app.use(errorController.get404);
app.use((error, req, res, next) => {
    return res.status(500).render('500', {
        pageTitle: 'Error!',
        path: '/500',
        isAuthenticated: req.session.isLoggedIn
    });
});

// Calls mongoConnect function and when successfull we listen for requests on port 3000
// mongoConnect(() => {
//     app.listen(3000);
// });

mongoose.connect(MONGODB_URI).then(result => {
    app.listen(3000);
}).catch(err => {
    console.log(err);
});
