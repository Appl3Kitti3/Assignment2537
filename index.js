/*
    TODO: Declare Constants.
 */
const {isValidSession, sessionValidation, isAuthorized} = require("./functions.js");
require('dotenv').config();
require('ejs');
const express = require("express");
const session = require("express-session")
const app = express();
const Joi = require("joi");
const bcrypt = require("bcrypt");
const {ObjectId} = require("mongodb");
const numberOfRandoms = 5;

/*
    TODO: Very Useful Information.
 */
const logOutWhen = 60 * 60 * 1000; //expires after 1 hour  (hours * minutes * seconds * millis)
const port = process.env.PORT || 8000;
const node_session_secret = process.env.NODE_SESSION_SECRET;

/*
    Use EJS to render.
 */
app.set('view engine', 'ejs');

/*
    TODO: Static calls.
 */
app.use("/js", express.static("./public/js"));
app.use("/css", express.static("./public/css"));
app.use("/img", express.static("./public/img"));

/*
    TODO: Connection Js Modules.
 */
const {usrCollection, mongoStore, getUser} = include('connection');

app.use(express.json());

/*
    TODO: Allows Body Parser.
    Middleware.
*/
app.use(express.urlencoded({ extended: true }));

/*
    TODO: Session Options.
    Middleware.
 */
app.use(session({
    secret: node_session_secret,
    store: mongoStore,
    saveUninitialized: false,
    resave: true
}));

/*
    TODO: GET METHODS
    TODO: Landing Page.
 */
app.get('/', (req, res) => {
    if (isValidSession(req))
        res.redirect('/main');
    else
        res.render('login', {error: 0});
});

/*
    TODO: Main Page, the "sessioned" page.
 */
app.use('/main', sessionValidation);
app.get('/main', (req, res) => {
        res.render('main', {name: req.session.username});
});

/*
    TODO: Sign Up page.
 */
app.get('/sign-up', (req, res) => {
    if (isValidSession(req))
        res.redirect('/main');
    else
        res.render('signUp', {error: false});
});

/*
    TODO: The Furry Pictures in their own page.
 */
app.get('/furry/:pawbID', (req, res) => {
    let pawID =req.params.pawbID;

    switch (pawID) {
        case "1":
            res.render('separateFur', {picture: "/img/boykisser.jpg"});
            return;
        case "2":
            res.render('separateFur', {picture: "/img/cuteFleurSketch.jpg"});
            return;
        case "3":
            res.render('separateFur', {picture: "/img/iconicfluff.jpg"});
            return;
        case "4":
            res.render('separateFur', {picture: "/img/peace.png"});
            return;
        case "5":
            res.render('separateFur', {picture: "/img/sleepingGamer.jpg"});
            return;
    }
});

app.get('/allFluffs', (req, res) => {
    res.render('fluffs');
});


/*
    TODO: Authorization Method.
 */
app.use('/admin', sessionValidation);
app.get('/admin', async (req, res) => {
    const curr = await getUser(req.session.username);
    if (await isAuthorized(req.session.username)) {
        const __users = await usrCollection.find().project({username: 1, password: 1, _id: 1, rank: 1}).toArray();
        res.render("admin", {__restrictOption: false, curr: curr, users: __users});
    } else {
        res.status(403);
        res.render("admin", {__restrictOption: true, curr: curr, users: []});
    }
})

app.get('/admin/:options/:_id', async (req, res) => {
    let id = req.params._id;
    let modifyOption = req.params.options;
    const filter = {_id: new ObjectId(id)};

    if (modifyOption === "promote") {
        await usrCollection.updateOne(filter, {$set: {rank: "admin"}});
    } else if (modifyOption === "demote") {
        await usrCollection.updateOne(filter, {$set: {rank: "user"}});
    }
    res.redirect('/admin');
})

/*
    TODO: Post Methods beyond this.
    TODO: Logging In Authentication Method
 */
app.post('/logging-in', async (req, res) => {
    let username = req.body.name;
    let password = req.body.password;

    const schematic = Joi.string().alphanum().max(20).required();
    const validationBool = schematic.validate(username);
    if (validationBool.error != null) {
        console.log(validationBool.error);
        res.redirect('/');
        return;
    }

    /* project: only one of each. */
    const __users = await usrCollection.find({username: username}).project({username: 1, password: 1, _id: 1}).toArray();

    if (__users.length !== 1) {
        res.render('login', {error: 1});
        return;
    }

    if (await bcrypt.compare(password,  __users[0].password)) {
        req.session.authenticated = true;
        req.session.username = username;
        req.session.cookie.maxAge = logOutWhen;
        res.redirect('/main');
        return;
    }

    else {
        res.render('login', {error: 2});
        return;
    }
});

/*
    TODO: Method on sign up.
 */
app.post('/creatingUser', async (req, res) => {
    let username = req.body.name;
    let password = req.body.password;

    /* TODO: Options of text. */
    const schematic = Joi.object({
        // TODO: Note to self: Alphanum -> Only Alphabetical Characters
        username: Joi.string().alphanum().max(20).required(),
        password: Joi.string().max(20).required()
    });

    /*
        TODO: Check if both username and password match the requirements.
     */
    const validationBool = schematic.validate({username, password});
    if (validationBool.error != null) {
        res.redirect('/sign-up');
        return;
    }

    let hashedPWD = await bcrypt.hash(password, numberOfRandoms);

    /* Add to database. :) */
    try {
        await usrCollection.insertOne({username: username, password: hashedPWD, rank: "user"});
    } catch (error) {
        res.render('signUp', {error: true});
        return;
    }
    /* TODO: Make usernames unique. */
    const __pkUsernameExists = await usrCollection.indexExists('username_1');
    if (!__pkUsernameExists) {
        await usrCollection.createIndex({ username: 1 }, { unique: true });
    }
    res.render('signUpSuccess');
})

/*
    TODO: End Session.
 */
app.post('/loggingOut', async (req, res) => {
    req.session.destroy();
    res.redirect('/');
})

/*
    TODO: Error 404.
 */
app.get("*", (req, res) => {
    res.status(404);
    res.render('404');
})

/*
    TODO: Listen thy thee?
 */
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});