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

mongoose.connect("mongodb+srv://vaccineTracker:Vaccinetracker%40123@child-vaccination-track.oiqbkgy.mongodb.net/childvaccinetracker", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});



//Registration Details for parents

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

// Setup Database Model // Define child Schema
const childSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    sex: String,
    birthplace: String,
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'parentsdetails'
    }
});


// Create child Model
const child_details = mongoose.model('childrendetails', childSchema);


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
        console.log("registration password  ata: " + registrationdata.password);

        registrationdata.password = await bcrypt.hash(registrationdata.password, salthassing);

        console.log("registration hased ata: " + JSON.stringify(registrationdata));

        //posting the details into mongo DB
        const createdUser = await Parent_details.create(registrationdata);

        res.render("login-parent");
    };

    // try {
    //     res.status(201).send('Parent registered successfully');
    // } catch (err) {
    //     console.error(err);
    //     res.status(500).send('Internal Server Error');
    // }



});
//login for parent

vaccineTracker.post('/parentLoginHome', async (req, res) => {
    try {
        const userCheck = await Parent_details.findOne({ username: req.body.userName });

        if (!userCheck) {
            return res.status(401).send('Invalid User name!');
        }

        const ispasswordmatch = await bcrypt.compare(req.body.password, userCheck.password);

        if (ispasswordmatch) {
            const registrationDetails = {
                firstName: userCheck.firstName,
                lastName: userCheck.lastName,
                address: userCheck.address,
                mobileNumber: userCheck.mobileNumber,
                sex: userCheck.sex,
                email: userCheck.email,
                username: userCheck.username
            };
            // Set registrationDetails in session


            // Render the parentLoginHome view with registrationDetails
            res.render('parentLoginHome', { registrationDetails: registrationDetails });

        } else {
            res.send("Wrong password");
        }
    }
    catch {
        res.send("Invalid Credentials");
    }

});


//adding child details

// Routes
//child registration
vaccineTracker.post('/add_child_vaccination', async (req, res) => {

    //getting details from the form
    const childRegistrationData = {
        firstName: req.body.childFirstName,
        lastName: req.body.childLastName,
        dateOfBirth: req.body.dateOfBirth,
        sex: req.body.sex,
        birthplace: req.body.birthplace,
        parent: req.body.parentId
    }

    //checking for duplicate values
    const existingUser = await child_details.findOne({
        firstName: childRegistrationData.firstName,
        lastName: childRegistrationData.lastName
    });
    console.log("existingUserLastname : " + childRegistrationData.lastName + "   existingUserfirstname :" + childRegistrationData.firstName);


    if (existingUser) {
        return res.status(409).send("Child's details already exist, please try with different details.");
    } else {
        //posting the details into mongo DB
        const createdUser = await child_details.create(childRegistrationData);

        res.render('childDetails', { childRegistrationData });
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
const { log } = require('console');

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
    // Check for session and registrationDetails existence
    if (req.session && req.session.registrationDetails) {
        const registrationDetails = req.session.registrationDetails; // Retrieve from session
        res.render('parentLoginHome', { registrationDetails: registrationDetails }); // Pass to template

    } else {
        // Handle case where session or data is missing (e.g., redirect to login)
        res.redirect('/login-parent');
    }
});

vaccineTracker.get('/childDetails', (req, res) => {
    if (req.session && req.session.childRegistrationData) {
        const childRegistrationData = req.session.childRegistrationData; // Retrieve from session
        res.render('childDetails', { childRegistrationData: childRegistrationData }); // Pass to template

    } else {
        // Handle case where session or data is missing (e.g., redirect to login)
        res.redirect('/addChildDetails');
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

vaccineTracker.get('/addChildDetails', (req, res) => {
    res.render('addChildDetails');
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
vaccineTracker.listen(8084);
console.log('Website Executed Sucessfully....Open Using http://localhost:8084/');