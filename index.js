/*
    TODO: Declare Constants.
 */
require("./functions.js");
require('dotenv').config();
const express = require("express");
const session = require("express-session")
const app = express();
const Joi = require("joi");
const fs = require("fs");
const MongoStore = require('connect-mongo');
const bcrypt = require("bcrypt");

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
 */
app.use(session({
    secret: node_session_secret,
    store: mongoStore,
    saveUninitialized: false,
    resave: true
}));

/*
    TODO: Landing Page.
 */
app.get('/', (req, res) => {
    let html;
    if (req.session.authenticated) {
        res.redirect('/main');
    } else {
        html = fs.readFileSync("./app/login.html", "utf-8");
    }
    res.send(html);
});

/*
    TODO: Main Page, the "sessioned" page.
 */
app.get('/main', (req, res) => {
    let html;
    /*
        TODO: Split em to acquire the session username.
     */
    if (req.session.authenticated) {
        html = fs.readFileSync("./app/main.txt", "utf-8");
        html+= req.session.username;
        html+= fs.readFileSync("./app/main2.txt", "utf-8")
        res.send(html);
    } else {
        res.redirect("/");
    }
});

/*
    TODO: Sign Up page.
 */
app.get('/sign-up', (req, res) => {
    if (req.session.authenticated) {
        res.redirect('/main');
        return;
    }
    let html = fs.readFileSync("./app/signUp.html", "utf-8");
    res.send(html);
});

/*
    TODO: Username is taken.
 */
app.get('/signUpFailure', (req, res) => {
    let html = fs.readFileSync("./app/signUpFailed.html", "utf-8");
    res.send(html);
});

/*
    TODO: The Furry Pictures in their own page.
 */
app.get('/furry/:pawbID', (req, res) => {
    let pawID =req.params.pawbID;

    console.log(pawID);
    if (pawID == 1)
        res.send("<body style='background-image: url(/img/boykisser.jpg); background-size: cover; background-position: center'><h1>The BoyKisser<br></h1></body>");
    else if (pawID == 2)
        res.send("<body style='background-image: url(/img/cuteFleurSketch.jpg); background-size: cover; background-position: center'><h1>Aurora<br></h1></body>");
    else if (pawID == 3)
        res.send("<body style='background-image: url(/img/iconicfluff.jpg); background-size: cover; background-position: center'><h1>Fluke<br></h1></body>");
    else if (pawID == 4)
        res.send("<body style='background-image: url(/img/peace.png); background-size: cover; background-position: center'><h1>Laura<br></h1></body>");
    else if (pawID == 5)
        res.send("<body style='background-image: url(/img/sleepingGamer.jpg); background-size: cover; background-position: center'><h1>A Sleeping Laura<br></h1></body>");
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
        let html = fs.readFileSync('./app/unknownUsername.html', "utf-8");
        res.send(html);
        return;
    }

    if (await bcrypt.compare(password, __users[0].password)) {
        req.session.authenticated = true;
        req.session.username = username;
        req.session.cookie.maxAge = logOutWhen;
        res.redirect('/main');
        return;
    }

    else {
        let html = fs.readFileSync('./app/invalidPassword.html', "utf-8");
        res.send(html);
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

    const __user = await usrCollection.findOne({username: username});
    let hashedPWD = await bcrypt.hash(password, numberOfRandoms);
    /*
        TODO: If user exists.
     */
    if (__user !== null) {
        res.redirect('/signUpFailure');
        return;
    }

    /* Add to database. :) */
    await usrCollection.insertOne({username: username, password: hashedPWD});

    let html = fs.readFileSync('./app/signUpSuccess.html', "utf-8");
    res.send(html);
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
    let html = fs.readFileSync("./app/404.html", "utf-8");
    res.send(html);
})

/*
    TODO: Listen thy thee?
 */
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});