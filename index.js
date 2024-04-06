// Import Dependencies
const express = require('express');
const app = express();
const session = require('express-session');
const path = require('path');
var vaccineTracker = express();
var bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const {check, validationResult} = require('express-validator');

// Set up the view engine to use EJS
vaccineTracker.set('view engine', 'ejs');

//converting data into json format
vaccineTracker.use(express.json());

// Create Object Destructuring For Express Validator
const { stringify } = require('querystring');
const { log, Console } = require('console');

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


// Setup Database Connection
const mongoose = require('mongoose');

mongoose.connect("mongodb+srv://vaccineTracker:Vaccinetracker%40123@child-vaccination-track.oiqbkgy.mongodb.net/childvaccinetracker", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

////////////////////////////////////////////////////////////Database Define Parent Schema////////////////////////////////////////////////////////

// Setup Database Model // Define Parent Schema
// Create Parent Model

const Parent_details = mongoose.model('parentsdetails', new mongoose.Schema({
    firstName: String,
    lastName: String,
    address: String,
    mobileNumber: String,
    sex: String,
    email: String,
    Spouse_firstName: String,
    Spouse_lastName: String,
    address: String,
    Spouse_mobileNumber: String,
    Spouse_Relation: String,
    Spouse_email: String,
    username: String,
    password: String
}));

//////////////////////////////////////////////////////////////// Define Vaccination Schema/////////////////////////////////////////////////

// Setup Database Model 
// Vaccination
const vaccination_details = mongoose.model('Vacciantiondetails', new mongoose.Schema({
    vaccinationName: String,
   vaccinationAgainst: String,
   vaccinationDate: String,
   vaccinationBy: String,
   vaccinationPlace: String,
   suggestedNextVaccinationDate: String,
   child_Id: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'childrendetails'
   },
   parent_Id: {
       type: mongoose.Schema.Types.ObjectId,
       ref: 'parentsdetails'
   }

}));


//////////////////////////////////////////////////////////////// Define child Schema/////////////////////////////////////////////////
const child_details = mongoose.model('childrendetails', new mongoose.Schema({
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    sex: String,
    birthplace: String,
    parent_Id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'parentsdetails'
    }

}));

////////////////////////////////////////////////////////////// Define Adult Schema//////////////////////////////////////////////////////////

// Define Adult Schema
const Adult_details = mongoose.model('adultdetails', new mongoose.Schema({
    firstName: String,
    lastName: String,
    dob: String,
    mobileNumber: String, // Add mobile number field
    email: String, // Add email field
    address: String, // Add address field
    username: String,
    password: String
}));



//////////////////////////////////////// Parent Registration///////////////////////////////////////////////
// Validation rules for password
const loginParentValidation = [
    check('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    check('password').matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter'),
    check('password').matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter'),
    check('password').matches(/[0-9]/).withMessage('Password must contain at least one number'),
    check('password').matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one symbol'),
    check('username').isLength({ min: 6 }).withMessage('Username must be at least 6 characters long'),
];

// Routes
vaccineTracker.post('/parent_registration', loginParentValidation, async (req, res, next) => {
    //getting details from the form
    const registrationdata = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        address: req.body.address,
        mobileNumber: req.body.mobileNumber,
        sex: req.body.sex,
        email: req.body.email,
        Spouse_firstName: req.body.Spouse_firstName,
        Spouse_lastName: req.body.Spouse_lastName,
        Spouse_mobileNumber: req.body.Spouse_mobileNumber,
        Spouse_Relation: req.body.Spouse_Relation,
        Spouse_email: req.body.Spouse_email,
        username: req.body.username,
        password: req.body.password
    }


    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
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

        res.status(201).json({ message: "Parent Registered Successfully" });

        // Redirect or render appropriate view after registration
        res.render("login-parent");
    }
});

    //////////////////////////////////////////////////Adult Registration Route//////////////////////////////////////////////////////////////

    // Adult Registration Validation
    const adultRegistrationValidation = [
        check('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
        check('username').isLength({ min: 6 }).withMessage('Username must be at least 6 characters long'),
        check('mobileNumber').notEmpty().withMessage('Invalid mobile number'), // Validate mobile number
        check('email').isEmail().withMessage('Invalid email address'), // Validate email
        check('address').notEmpty().withMessage('Address is required') // Validate address
    ];

    // Adult Registration Route
    vaccineTracker.post('/adult_registration',async (req, res, next) => {
        // Validate dob in the request body
        const dob = new Date(req.body.dob); // Parse the date of birth from the request body
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        if (age < 18) {
            return res.status(400).json({ errors: [{ msg: 'You must be at least 18 years old to register as an adult', param: 'dob' }] });
        }

        // Get details from the registration form
        const adultRegistrationData = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            dob: req.body.dob, // Date of birth
            age: age,
            mobileNumber: req.body.mobileNumber,
            email: req.body.email,
            address: req.body.address,
            username: req.body.username,
            password: req.body.password
        };

        req.session.adultRegistrationData = adultRegistrationData;

        // Check for existing username
        const existingUsername = await Adult_details.findOne({ username: adultRegistrationData.username });
        if (existingUsername) {
            return res.status(409).send("Username already taken, please choose a different username");
        }

        // Hash the password
        const saltHash = await bcrypt.genSalt(12);
        adultRegistrationData.password = await bcrypt.hash(adultRegistrationData.password, saltHash);

        // Create the adult document in the database
        const createdUser = await Adult_details.create(adultRegistrationData);
        res.render("adult_registration"); // Render login page after successful registration
    });

/////////////////////////////////////////////////////////////////login for parent//////////////////////////////////////////////////////////

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
                Spouse_firstName: userCheck.Spouse_firstName,
                Spouse_lastName: userCheck.Spouse_lastName,
                Spouse_mobileNumber: userCheck.Spouse_mobileNumber,
                Spouse_Relation: userCheck.Spouse_Relation,
                Spouse_email: userCheck.Spouse_email,
                username: userCheck.username,
                _id: userCheck._id
            };
            // Render the parentLoginHome view with registrationDetails
            req.session.registrationDetails = registrationDetails;

            const parentID = registrationDetails._id;
            console.log("Session before setting parentID:", req.session);
            req.session.parentID = parentID;
            console.log("Session .............after setting parentID:", req.session)

            // Fetch children details based on parent ID
            const children = await child_details.find({ parent_Id: userCheck._id });

            res.render('parentLoginHome', { registrationDetails: registrationDetails, children: children });

        } else {
            res.send("Wrong password");
        }
    }
    catch {
        res.send("Invalid Credentials");
    }

});

/////////////////////////////////////////////////////////////////login for adult//////////////////////////////////////////////////////////

vaccineTracker.post('/adultLoginHome', async (req, res) => {
    try {
        const userCheck = await Adult_details.findOne({ username: req.body.userName });
        console.log(" adult detailsMatch:", userCheck);
        req.session.userCheck =  userCheck;

        if (!userCheck) {
            console.log("User not found:", req.body.userName);
            return res.status(401).send('Invalid Username');
        }
         

        const isPasswordMatch = await bcrypt.compare(req.body.password, userCheck.password);
        console.log("Password Match:", isPasswordMatch);

        if (isPasswordMatch) {
            // Calculate age based on date of birth
            const dob = new Date(userCheck.dob);
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const monthDiff = today.getMonth() - dob.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                age--;
            }

            if (age >= 18) {
                // Handle adult login
                console.log("Adult login successful");
                console.log("Session data:", userCheck);
                res.render('adultLoginHome', { registrationDetails: userCheck });
            } else {
                // Handle case where user is not above 18 years old
                console.log("User is not above 18 years old");
                res.render("You must be at least 18 years old to login as an adult");
            }
        } else {
            console.log("Incorrect password");
            return res.render("Wrong password");
        }
    } catch (error) {
        console.error("Error:", error);
        return res.send("Invalid Credentials");
    }
});

///////////////////////////////////////////////////////////////////////Post Login-admin Page//////////////////////////////////////////////////////////////////////
vaccineTracker.post('/login-admin', [
    check('userName', 'User Name is required!').notEmpty(),
    check('password', 'Password is required!').notEmpty(),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('login-admin', { errors: errors.array() });
        }

        const { userName, password } = req.body;

        // Check if admin with provided username exists
        const admin = await Admin.findOne({ userName: userName });
        console.log(`Admin result from db: ${admin}`);
        if (!admin) {
            return res.render('login-admin', { errors: [{ msg: 'Invalid username or password' }] });
        }

        // Compare passwords (plain text)
        if (admin.password !== password) {
            return res.render('login-admin', { errors: [{ msg: 'Invalid username or password' }] });
        }

        // Set session variables
        req.session.username = admin.username;
        req.session.userLoggedIn = true;

        // Redirect to dashboard or any other desired route
        res.redirect('/adminLoginHome');
    } catch (error) {
        console.error('Error during admin login:', error);
        res.status(500).send('Internal Server Error');
    }
});

////////////////////////////////////////////////adding child details///////////////////////////////////////
//-------------------------------------------------------------------------------------------------------//

// Routes
//child registration
vaccineTracker.post('/add_child_vaccination', async (req, res) => {
    // Retrieve parent ID from session
    const parentID = req.session.parentID;

    // Ensure parent ID exists
    if (!parentID) {
        return res.status(400).send("Parent ID not found in session");
    }

    //getting details from the form
    const childRegistrationData = {
        firstName: req.body.childFirstName,
        lastName: req.body.childLastName,
        dateOfBirth: req.body.dateOfBirth,
        sex: req.body.sex,
        birthplace: req.body.birthplace,
        parent_Id: parentID
    }

    //checking for duplicate values
    const existingUser = await child_details.findOne({
        firstName: childRegistrationData.firstName,
        lastName: childRegistrationData.lastName,
        parent_Id: parentID
    });

    if (existingUser) {
        return res.status(409).send("Child's details already exist, please try with different details.");
    } else {
        //posting the details into mongo DB by Creating the child document in the child collection
        console.log('Created Child started:'); 
        const createdUser = await child_details.create(childRegistrationData);
        console.log('Created Child:', createdUser.parent_Id); // Log created child document for debugging

        // Set child ID in session
        const childID = createdUser._id;
        req.session.childID = childID;
        
        // Render the addChildDetails template with parent ID
        res.render('addChildDetails', { registrationDetails: { _id: parentID } });
    }
});


////////////////////////////////////////////////adding Vaccination details///////////////////////////////////////
//-------------------------------------------------------------------------------------------------------//
vaccineTracker.post('/add_Vaccination_Details', async (req, res) => {
    try {
       
        const childId = req.body.childId; // Retrieve child ID from query string
        console.error(" child id for the session :  " + childId);

        // Check if childId is provided
        if (!childId) {
            return res.status(404).send('Child not found');
        }

        const parentId = req.session.parentID;
        console.error(" parentId id for the session :  " + parentId);

        // Check if parentID is available in the session
        if (!parentId) {
            return res.status(404).send('Parent ID not found in session');
        }

        // Extract vaccination details from the request body
        const vaccinationData = {
            vaccinationName: req.body.vaccinationName,
            vaccinationAgainst: req.body.vaccinationAgainst, // Retrieve vaccinationAgainst from the request body
            vaccinationDate: req.body.vaccinationDate,
            vaccinationBy: req.body.vaccinationBy,
            vaccinationPlace: req.body.vaccinationPlace,
            suggestedNextVaccinationDate: req.body.suggestedNextVaccinationDate, // Retrieve suggestedNextVaccinationDate from the request body
            child_Id: childId, // Associate vaccination with child using child ID
            parent_Id: parentId // Associate vaccination with parent using parent ID
        };
        console.log("vaccination details : "+JSON.stringify(vaccinationData));
       await vaccination_details.create(vaccinationData);
        
        res.render('addVaccinationDetails', { child: { _id: childId } });

        // Create vaccination document in the database
       // const createdVaccination = await vaccination_details.create(vaccinationData);
       // res.status(201).json({ message: "Vaccination details added successfully" });
       

    } catch (error) {
        console.error('Error adding vaccination details:', error);
        res.status(500).send('Error adding vaccination details');
    }
});


////////////////////////////////////////////////adding Vaccination details for adult///////////////////////////////////////
//-------------------------------------------------------------------------------------------------------//
vaccineTracker.post('/adultVaccinationDetails', async (req, res) => {
    try {
       
        const adultId = req.session.userCheck_id; // Retrieve child ID from query string
        console.error(" child id for the session :  " + adultId);

        // Check if childId is provided
        if (!childId) {
            return res.status(404).send('Child not found');
        }

        
        console.error(" parentId id for the session :  " + adultId);

        // Check if parentID is available in the session
        if (!adultId) {
            return res.status(404).send('Parent ID not found in session');
        }

        // Extract vaccination details from the request body
        const vaccinationData = {
            vaccinationName: req.body.vaccinationName,
            vaccinationAgainst: req.body.vaccinationAgainst, // Retrieve vaccinationAgainst from the request body
            vaccinationDate: req.body.vaccinationDate,
            vaccinationBy: req.body.vaccinationBy,
            vaccinationPlace: req.body.vaccinationPlace,
            suggestedNextVaccinationDate: req.body.suggestedNextVaccinationDate, // Retrieve suggestedNextVaccinationDate from the request body
            adult_Id: adultId, // Associate vaccination with child using child ID
            
        };
        console.log("vaccination details : "+JSON.stringify(vaccinationData));
       await vaccination_details.create(vaccinationData);
        
        res.render('adultVaccinationDetails', { adult: { _id: adultId } });

        // Create vaccination document in the database
       // const createdVaccination = await vaccination_details.create(vaccinationData);
       // res.status(201).json({ message: "Vaccination details added successfully" });
       

    } catch (error) {
        console.error('Error adding vaccination details:', error);
        res.status(500).send('Error adding vaccination details');
    }
});


////////////////////////////////////////////////////// Delete Child Route////////////////////////////////////////////////
vaccineTracker.post('/deleteChild',async (req, res) => {
    try {
        const childId = req.body.childId;

        // Check if the childId is provided
        if (!childId) {
            return res.status(400).send('Child ID is required');
        }

        // Find the child document in the database
        const child = await child_details.findById(childId);

        // If the child document does not exist, return an error
        if (!child) {
            return res.status(404).send('Child not found');
        }

        // Delete the child document from the database
        await child_details.findByIdAndDelete(childId);

        // Redirect back to the parentLoginHome page
        res.redirect('/parentLoginHome');
    } catch (error) {
        console.error('Error deleting child:', error);
        res.status(500).send('Error deleting child');
    }
});

/////////////////////////////////////deleting the vaccination record /////////////////////////////////////////////////
//-----------------------------------------------------------------------------------------------//
vaccineTracker.post('/deleteVaccination', async (req, res) => {
    try {
        const vaccinationId = req.body.vaccinationId;

        // Check if the vaccinationId is provided
        if (!vaccinationId) {
            return res.status(400).send('Vaccination ID is required');
        }

        // Find the vaccination document in the database
        const vaccination = await vaccination_details.findById(vaccinationId);

        // If the vaccination document does not exist, return an error
        if (!vaccination) {
            return res.status(404).send('Vaccination record not found');
        }

        // Delete the vaccination document from the database
        await vaccination_details.findByIdAndDelete(vaccinationId);

        // Redirect back to the vaccination record page
        res.redirect('/vaccinationRecord?childId=' + vaccination.child_Id);
    } catch (error) {
        console.error('Error deleting vaccination record:', error);
        res.status(500).send('Error deleting vaccination record');
    }
});

/////////////////////////////////////deleting the complete record /////////////////////////////////////////////////
//-----------------------------------------------------------------------------------------------//

vaccineTracker.post('/delete', async (req, res) => {
    try {
         // Extract parent ID from the request body
         const parentId = req.body.parentId;
         console.log('Parent ID:', parentId);

         // Perform deletion of children and vaccinations associated with the parent
         await child_details.deleteMany({ parent_Id: parentId });
         await vaccination_details.deleteMany({ parent_Id: parentId });
         await Parent_details.findByIdAndDelete(parentId);

         // Send a success response
         console.log('Children and vaccinations deleted successfully.');
         res.redirect('/adminLoginHome');
     } catch (error) {
         console.error('Error deleting children and vaccinations:', error);
         res.status(500).send('Error deleting children and vaccinations.');
     }
});



/////////////////////////////////////////////////////////////////////////////// Root Page Post Method (Server Response)/////////////////////////////////////////////////////
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

/////////////////////////////////////////////////////////Setup Admin Database Model//////////////////////////////////////////////////////
const Admin = mongoose.model('admindetails',new mongoose.Schema({
    userName: String,
    password: String
}));


////////////////////////////////////////////////Define route to handle viewing vaccination records/////////////////////////////////////////
vaccineTracker.get('/vaccinationRecord', async (req, res) => {
    try {
        const childId = req.query.childId;

        // Fetch vaccination records for the child from the database
        const vaccinations = await vaccination_details.find({ child_Id: childId });

        // Fetch child details from the database based on child ID
        const child = await child_details.findById(childId);
        
        // If child is found, get the child's name
        const childName = child ? `${child.firstName} ${child.lastName}` : 'Unknown';
        console.error('vaccination records of :'+childName);


        // Render the vaccination record view with the retrieved records and child's name
        res.render('vaccinationRecord', { vaccinations: vaccinations, childName: childName });
    } catch (error) {
        console.error('Error fetching vaccination records:', error);
        res.status(500).send('Error fetching vaccination records');
    }
});


//////////////////////////////////////////////////////// Rendering to load pages/////////////////////////////////////
//Root Page Get Method (First time page load)

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
vaccineTracker.get('/adultLoginHome', function (req, res) {
    res.render('adultLoginHome',);
});
vaccineTracker.get('/adult_registration', (req, res) => {
    res.render('adult_registration'); // Render the adult registration form
});

// Route handler for adminLoginHome
vaccineTracker.get('/adminLoginHome', async (req, res) => {
    try {
        // Fetch all parents from the database
        const parents = await Parent_details.find({});
        
        // Iterate over each parent and fetch their respective children and vaccination details
        const parentData = [];
        for (const parent of parents) {
            const children = await child_details.find({ parent_Id: parent._id });
            const vaccinations = await vaccination_details.find({ parent_Id: parent._id });
            parentData.push({ parent: parent, children: children, vaccinations: vaccinations });
        }

        // Render the adminLoginHome view with the retrieved parent data
        res.render('adminLoginHome', { parentData: parentData });
    } catch (error) {
        console.error('Error fetching parent and child details:', error);
        res.status(500).send('Error fetching parent and child details');
    }
});

//////////////////////////////////////////////////////// Route Handler//////////////////////////////////////////////////////

vaccineTracker.get('/parentLoginHome', async(req, res) => {
    console.log("get parent session:" + req.session);
    console.log("get parent reg :" + req.session.registrationDetails);
    // Check for session and registrationDetails existence
    if (req.session && req.session.registrationDetails) {
        console.log("get parent reg if caluse :" +req.session.registrationDetails );
        const registrationDetails = req.session.registrationDetails; // Retrieve from session
        console.log("get parent reg if caluse :" +registrationDetails);
        const registrationDetailsStringified = JSON.stringify(registrationDetails);
        console.log("Stringified registrationDetails:", registrationDetailsStringified);

        const parentID = registrationDetails._id;
       
        // Fetch children details based on parent ID
        const children = await child_details.find({ parent_Id: parentID });

        res.render('parentLoginHome', { registrationDetails: registrationDetails, children: children });      

    } else {

        // Handle case where session or data is missing (e.g., redirect to login)
        res.redirect('/login-parent');
    }
});

//////////////////////////////////// Route handler for addVaccinationDetails view with the child object////////////////////////////////

vaccineTracker.get('/addVaccinationDetails', async (req, res) => {
    try {   
        // Retrieve child ID from query parameters
        const childId = req.query.childId;
        console.error(" child getting id from the session :  " + childId);
 // Find the child by ID
 const child = await child_details.findById(childId);
console.log("child details"+child);
        // Check if childId is provided
        if (child) {
            console.log("child details id"+childId);
            // Render the addVaccinationDetails.ejs template and pass the child object
            res.render('addvaccinationDetails', { child: { _id: childId } });
        } else {
            // Handle case where child is not found
            res.status(404).send('Child not found');
          }

       
    } catch (error) {
        console.error('Error rendering addVaccinationDetails:', error);
        res.status(500).send('Internal server error');
    }
});



vaccineTracker.get('/addChildDetails', (req, res) => {
    const registrationDetails = req.session.registrationDetails;
    if (registrationDetails) {
        res.render('addChildDetails', { registrationDetails: registrationDetails });
    } else {
        // Handle case where session data is missing
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


//////////////////////////////////////////////////////// Logout Page//////////////////////////////////////////////////////

vaccineTracker.get('/logout', (req, res) => {
    req.session.username = '';
    req.session.userLoggedIn = false;
    res.render('login-parent', { error: "Logout Successfully! " });
});


//////////////////////////////////////////////////////// Login Page//////////////////////////////////////////////////////
vaccineTracker.get('/login-parent', (req, res) => {
    res.render('login-parent');
});
vaccineTracker.get('/login-adult', (req, res) => {
    res.render('login-adult');
});
vaccineTracker.get('/login-admin', (req, res) => {
    res.render('login-admin');
});


////////////////////////////////////////////////////////////////////// Error handling middleware function///////////////////////////////////////////////////////
// This function is called when an error occurs in the application
// It logs the error stack trace to the console for debugging purposes
// and sends a response with a 500 status code and a generic message to the user

vaccineTracker.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});


/////////////////////////////////////////////////////////mailNotification Configuarations////////////////////////////////////////////
//=================================================================================================================================//
const cron = require('node-cron');
const nodemailer = require('nodemailer');
// Function to send email notification
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'childvaccinationtracker1@gmail.com',
        pass: 'cqwo zfwk utvj qjkj'
    }
});

// Fetch all parent records from the database
vaccination_details.find({})
    .then(async vaccinations => {
        // Check if there are any vaccination records
        if (vaccinations.length === 0) {
            console.log('No vaccination records found.');
            return;
        }

        // Iterate over each vaccination record
        for (const vaccination of vaccinations) {
            try {
                // Find parent details for the current vaccination
                const parent = await Parent_details.findById(vaccination.parent_Id);
                const child = await child_details.findById(vaccination.child_Id);

                // Check if parent exists
                if (!parent) {
                    console.log(`Parent not found for vaccination ID: ${vaccination._id}`);
                    continue;
                }

                // Compose email subject with parent's name
                const subject = `Vaccination Notification for ${parent.firstName} ${parent.lastName}`;

                // Compose email body
                let text = `Dear ${parent.firstName} ${parent.lastName},\n\n`;
                text += `This is a notification message regarding your child ${child.firstName} ${child.lastName} Vaccination:\n\n`;

                // Include vaccination details
                text += `- Vaccination Name: ${vaccination.vaccinationName}\n`;
                text += `- Vaccination Date: ${vaccination.vaccinationDate}\n\n`;
                text += `- Vaccination for: ${vaccination.vaccinationAgainst}\n\n`;
                text += `- NEXT Vaccination Date: ${vaccination.suggestedNextVaccinationDate}\n\n`;

                text += `Sincerely,\nThe Vaccine Tracker Team`;

                // Configure mail options
                const mailOptions = {
                    from: 'childvaccinationtracker1@gmail.com',
                    to: parent.email,
                    subject: subject,
                    text: text
                };

                // Send email
                const info = await transporter.sendMail(mailOptions);
                console.log('Email sent:', info.response);
            } catch (error) {
                console.error('Error sending email:', error);
            }
        }
    })
    .catch(error => {
        console.error('Error fetching vaccination records:', error);
    });



// Execute Website Using Port Number for Localhost
// Start Server
const PORT = process.env.PORT || 2705;
vaccineTracker.listen(PORT, () => {
    console.log(`Server is running successfully on port ${PORT}, ....Open Using http://localhost:${PORT}/'`);
});