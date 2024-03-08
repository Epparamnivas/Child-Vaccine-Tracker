// Import Dependencies
const express = require('express');
const session = require('express-session');
const path = require('path');
var vaccineTracker = express();

// Setup Database Connection
const mongoose = require('mongoose');
const { MongoClient, Double } = require('mongodb');
mongoose.connect('mongodb://localhost:27017/vaccineTracker', {
    UseNewUrlParser: true,
    UseUnifiedTopology: true
});


// Setup Database Model
const Order = mongoose.model('Orders', {
    fathername: String,
    mothername: String,
    childname: String,
});

//Setup Admin Database Model
const Admin = mongoose.model('Admin', {
    uName: String,
    pass: String

});

// Create Object Destructuring For Express Validator
const { check, validationResult } = require('express-validator');
const { stringify } = require('querystring');

// Express Body-Parser
vaccineTracker.use(express.urlencoded({ extended: true }));
//session
vaccineTracker.use(session({
    secret: 'mysecret',
    resave: false,
    saveUninitialized: true
}))

// Set Path to public and views forlder
vaccineTracker.set('views', path.join(__dirname, 'views'));
vaccineTracker.use(express.static(__dirname + '/public'));
vaccineTracker.set('view engine', 'ejs');


// Root Page Get Method (First time page load)
vaccineTracker.get('/', function (req, res) {
    res.render('Home');
});

vaccineTracker.get('/vaccinationDetails', function (req, res) {
    res.render('vaccinationDetails',);
});

vaccineTracker.get('/aboutUs', function (req, res) {
    res.render('aboutUs',);
});
vaccineTracker.get('/contactUs', function (req, res) {
    res.render('contactUs',);
});

// Root Page Post Method (Server Response)
vaccineTracker.post('/', [
    
    
], function (req, res) {
    const errors = validationResult(req);
    console.log(errors);
    if (!errors.isEmpty()) {
        res.render('orderForm', { errors: errors.array() });

    } else {
        res.render('orderConfirm', orderDB);
    }
});

vaccineTracker.post('/orderConfirm', function (req, res) {
    console.log("OrderData for DB:"+orderDB);
    var order = new Order(orderDB);
    order.save().then(function () {
        console.log("Order Saved Successfully !");
        res.render('formMessage', { message: " Added Successfully!" });
    });
});


//Validations

function validateRegex(input, regEx) {
    if (regEx.test(input)) {
        return true;
    } else
        return false;
}

// Logout Page
vaccineTracker.get('/logout', (req, res) => {
    req.session.username = '';
    req.session.userLoggedIn = false;
    res.render('login', { error: "Logout Successfully! " });
});


// All  Page
vaccineTracker.get('/allOrders', (req, res) => {
    // If Session Exists, Then Access All  Page
    if (req.session.userLoggedIn) {
        Order.find({}).then((orders) => {
            console.log(`orders: ${orders}`);
            res.render('allOrders', {orders: orders });
        }).catch(function (err) {
            console.log(`Error: ${err}`);
        });
    }
    else {
        // Otherwise Redirect User To Login Page
        res.redirect('/login');
    }
});



// Login Page
vaccineTracker.get('/login', (req, res) => {
    res.render('login');
});

// Post Login Page
vaccineTracker.post('/login', [
    check('userName', 'User Name is required!').notEmpty(),
    check('password', 'Password is required!').notEmpty(),
], (req, res) => {
    const errors = validationResult(req);
    console.log(errors);
    if (!errors.isEmpty()) {
        // Display Error Messages
        res.render('login', { errors: errors.array() });
    } else {
        console.log(req.body);
        var userName = req.body.userName;
        var password = req.body.password;
        console.log(`userName=${userName} and password: ${password}`);
        //Validate against DB
        Admin.findOne({ aname: userName, pass: password }).then((admin) => {
            console.log(`Admin result from db: ${admin}`);
            if (admin) {
                req.session.username = admin.username;
                req.session.userLoggedIn = true;
                res.redirect('/allorders');
            } else {
                res.render('login', { errors: "Sorry Login Failed. Please Try Again!" });
                console.log(errors);
            }

        }).catch((err) => {
            console.log(`Error: ${err}`);
        })
    }
});

// Delete Page - Get Method
vaccineTracker.get('/delete/:_id', (req, res) => {
    if (req.session.userLoggedIn) {
        var id = req.params._id;
        Order.findByIdAndDelete({ _id: id }).then((order) => {
            console.log(`page : ${order}`);
            if (order) {
                res.render('deleteMessage', { message: "Page Deleted Successfully!" });
            }
            else {
                res.render('deleteMessage', { message: "Something Went Wrong. page Not Deleted!" });
            }
        }).catch(function (err) {
            console.log(`Error: ${err}`);
        });
    }
    else {
        // Otherwise Redirect User To Login Page
        res.redirect('/login');
    }
});

// Execute Website Using Port Number for Localhost
vaccineTracker.listen(8080);
console.log('Website Executed Sucessfully....Open Using http://localhost:8080/');