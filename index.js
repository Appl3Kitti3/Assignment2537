/*
    TODO: Declare Constants.
 */
require("./functions.js");
require('dotenv').config();
require('ejs');
const express = require("express");
const session = require("express-session")
const app = express();
const Joi = require("joi");
const MongoStore = require('connect-mongo');
const bcrypt = require("bcrypt");
const {func} = require("joi");
const {ObjectId} = require("mongodb");
const numberOfRandoms = 5;

/*
    TODO: Very Useful Information.
 */
const logOutWhen = 60 * 60 * 1000; //expires after 1 hour  (hours * minutes * seconds * millis)
const port = process.env.PORT || 8000;
const node_session_secret = process.env.NODE_SESSION_SECRET;

const mdb_host = process.env.MONGODB_HOST;
const mdb_user = process.env.MONGODB_USER;
const mdb_password = process.env.MONGODB_PASSWORD;
const mdb_dbName = process.env.MONGODB_DATABASE;
const mdb_secret = process.env.MONGODB_SESSION_SECRET;

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
    TODO: Get MONGODB Database.
 */
let {database} = include('connection');
const usrCollection = database.db(mdb_dbName).collection('users');

app.use(express.json());

/*
    TODO: Allows Body Parser.
    Middleware.
*/
app.use(express.urlencoded({ extended: true }));

/*
    TODO: MongoDB Options.
 */
let mongoStore = MongoStore.create({
    mongoUrl: `mongodb+srv://${mdb_user}:${mdb_password}@${mdb_host}/sessions`,
    crypto: {
        secret: mdb_secret
    }
});

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
    TODO: FUNCTIONS AREA
 */

function isValidSession(req) {
    console.log((req.session.cookie.maxAge / 60) / 1000);
    return req.session.authenticated;
}

/*
    TODO: Middleware method, chain like function.
 */
function sessionValidation(req, res, next) {
    if (isValidSession(req))
        next();
    else
        res.redirect('/');
}

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
            res.send("<body style='background-image: url(/img/boykisser.jpg); background-size: cover; background-position: center'><h1>The BoyKisser<br></h1></body>");
            return;
        case "2":
            res.send("<body style='background-image: url(/img/cuteFleurSketch.jpg); background-size: cover; background-position: center'><h1>Aurora<br></h1></body>");
            return;
        case "3":
            res.send("<body style='background-image: url(/img/iconicfluff.jpg); background-size: cover; background-position: center'><h1>Fluke<br></h1></body>");
            return;
        case "4":
            res.send("<body style='background-image: url(/img/peace.png); background-size: cover; background-position: center'><h1>Laura<br></h1></body>");
            return;
        case "5":
            res.send("<body style='background-image: url(/img/sleepingGamer.jpg); background-size: cover; background-position: center'><h1>A Sleeping Laura<br></h1></body>");
            return;
    }
});

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

    if (await bcrypt.compare(password, __users[0].password)) {
        req.session.authenticated = true;
        req.session.username = username;
        req.session.cookie.maxAge = logOutWhen;
        console.log("Cry");
        res.redirect('/main');
        return;
    }

    else {
        res.render('login', {error: 2});
        return;
    }
});

app.get('/allFluffs', (req, res) => {
    res.render('fluffs');
})
app.use('/admin', sessionValidation);
app.get('/admin', async (req, res) => {
        const curr = await getUser(req.session.username);
        if (curr.rank === "admin") {
            const __users = await usrCollection.find().project({username: 1, password: 1, _id: 1, rank: 1}).toArray();
            res.render("admin", {__restrictOption: false, curr: curr, users: __users});
        } else {
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
    // let html = fs.readFileSync("./app/404.html", "utf-8");
    res.render('404');
    // res.send(html);
})

/*
    TODO: Listen thy thee?
 */
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

function getUser(key) {
    return usrCollection.findOne({username: key});
}

function getUser2(token) {
    return usrCollection.findOne({_id: token});
}