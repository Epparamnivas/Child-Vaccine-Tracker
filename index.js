// Import Dependencies
const express = require('express');
const session = require('express-session');
const path = require('path');
var vaccineTracker = express();
var bcrypt = require("bcrypt");

// Set up the view engine to use EJS
vaccineTracker.set('view engine', 'ejs');

//converting data into json format
vaccineTracker.use(express.json());
vaccineTracker.use(express.urlencoded({ extended: true }))

// Setup Database Connection
const mongoose = require('mongoose');
const { MongoClient, Double } = require('mongodb');
mongoose.connect('mongodb://localhost:27017/ChildvaccineTracker', {
    UseNewUrlParser: true,
    UseUnifiedTopology: true
});



//Rwgistration Details

// Setup Database Model // Define Parent Schema
const parentSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    address: String,
    mobileNumber: String,
    sex: String,
    email: String,
    username: String,
    password: String
});


// Create Parent Model
const Parent_details = mongoose.model('parentsdetails', parentSchema);

// Routes
// Parent Registration
vaccineTracker.post('/parent_registration', async (req, res) => {

    //getting details from the form
    const registrationdata = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        address: req.body.address,
        mobileNumber: req.body.mobileNumber,
        sex: req.body.sex,
        email: req.body.email,
        username: req.body.username,
        password: req.body.password
    }

    //checking for duplicate values
    const existingUseremail = await Parent_details.findOne({ email: registrationdata.email });
    const existingUsername = await Parent_details.findOne({ username: registrationdata.username });
    if (existingUseremail) {
        return res.status(409).send("Email id already exists, please try with different Email Id");
    } else if (existingUsername) {
        return res.status(409).send("Username already taken, Please use a different Username")
    } else {

        //hashing the password
        const salthassing = await bcrypt.genSalt(12);
        console.log("registration password  ata: "+registrationdata.password);

        registrationdata.password = await bcrypt.hash(registrationdata.password, salthassing);
 
        console.log("registration hased ata: "+JSON.stringify(registrationdata));

        //posting the details into mongo DB
        const createdUser = await Parent_details.create(registrationdata);
        return res.status(201).json(createdUser);
    };

    try {
        res.status(201).send('Parent registered successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});


//login for parent
vaccineTracker.post('/parentLogin', async (req, res) => {
    try {
        console.log("username:" + req.body.userName);
        const userCheck = await Parent_details.find({ username: req.body.userName });
        console.log("username userCheck:" + userCheck);
        if (userCheck.length === 0) {
            return res.status(401).send('Invalid User name!');
        }
        console.log("ispasswordmatch password:" + req.body.password + "userCheck[0].password:" + userCheck[0].password);
        const ispasswordmatch = await bcrypt.compare(req.body.password, userCheck[0].password);
        console.log("ispasswordmatch:" + ispasswordmatch)
        if (ispasswordmatch) {
            res.render("parentLoginHome");
        } else {
            req.send("wrong password");
        }
    }
    catch {
        res.send("Invalid Credentials");
    }
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
vaccineTracker.get('/parent_registration', function (req, res) {
    res.render('parent_registration',);
});


// Root Page Post Method (Server Response)
vaccineTracker.post('/', [
], function (req, res) {
    const errors = validationResult(req);
    console.log(errors);
    if (!errors.isEmpty()) {
        res.render('Home', { errors: errors.array() });

    } else {
        res.render('userConfirm', orderDB);
    }
});



// All  Page
vaccineTracker.get('/parentLoginHome', (req, res) => {
    // If Session Exists, Then Access All  Page
    if (req.session.userLoggedIn) {
        res.render('login-parent',);
    }
    else {
        // Otherwise Redirect User To Login Page
        res.redirect('/login-parent',);
    }
});



// Logout Page
vaccineTracker.get('/logout', (req, res) => {
    req.session.username = '';
    req.session.userLoggedIn = false;
    res.render('login', { error: "Logout Successfully! " });
});


// Login Page
vaccineTracker.get('/login-parent', (req, res) => {
    res.render('login-parent');
});
vaccineTracker.get('/login-adult', (req, res) => {
    res.render('login-adult');
});
vaccineTracker.get('/login-admin', (req, res) => {
    res.render('login-admin');
});


// Post Login-admin Page
vaccineTracker.post('/login-parent', [
    check('userName', 'User Name is required!').notEmpty(),
    check('password', 'Password is required!').notEmpty(),
], (req, res) => {
    const errors = validationResult(req);
    console.log(errors);
    if (!errors.isEmpty()) {
        // Display Error Messages
        res.render('login-admin', { errors: errors.array() });
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
                res.redirect('/userDetails');
            } else {
                res.render('login-admin', { errors: "Sorry Login Failed. Please Try Again!" });
                console.log(errors);
            }

        }).catch((err) => {
            console.log(`Error: ${err}`);
        })
    }
});


// Execute Website Using Port Number for Localhost
vaccineTracker.listen(8082);
console.log('Website Executed Sucessfully....Open Using http://localhost:8082/');