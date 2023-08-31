import express from "express";
import path from "path";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt"; // database a jokhon ami password store korbo tokhon ota normal vabe store hobe....and database khule oi password sobai dekte pabe.....kintu ata secure way noi....tai ai module ta use korle.....database a password store er somoy ota encode kore tarpor store korbe.....main password keo dekte pabe na.....akbar encode hole ota ar decode kora jai na....tai ai way ta besi secure.......

const app = express();

// midle wares
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// set the view engine
app.set("view engine", "ejs");

// database connection
mongoose.connect("mongodb://127.0.0.1:27017", {
    dbName: "loginform"
}).then(() => console.log("database connected")).catch((e) => console.log(e));

// database schema define
const userschema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
})

// database model define
const User = mongoose.model("user", userschema);

//------------------------------------------------------------------------------------------------------------------------------------------------

// bydefault page load....

const isAuthenticate = async (req, res, next) => {
    const { token } = req.cookies;
    if (token) {
        const decoded = jwt.verify(token, "abcdefgh");
        req.user = await User.findById(decoded._id);
        next();
    }
    else {
        res.redirect("/login")
    }
}

app.get("/", isAuthenticate, (req, res) => {
    res.render("logout", { name: req.user.name });
})

//-----------------------------------------------------------------------------------------------------------------------------------------------

// register....

app.get("/register", (req, res) => { // jokhon "/register" er modhe register kei render korchi tokhon form er action "/register" deoyar dorkar nei 
    res.render("register");
})

app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) {
        return res.render("userexist", { msg: "User Already Registered....." });
    }
    else {
        const encodepass = await bcrypt.hash(password, 10); // ata use kore password take encode korlam......bcrypt.hash() function er mohdhe 2 to value dite hobe ......akta password ta..... ar akta number(10).....joto besi number oi encoded password toto strong.......await lagalam karon age password ai line a encode hobe......tarpor next line a ota database a store hobe......await na dile encode korte je time nebe tar agei next line execute hoye jabe ar database a store hoye jabe.....
        user = await User.create({ name: name, email: email, password: encodepass });
        res.render("userexist", { msg: "Successfully Registered...." });
    }
})

app.get("/userexist", (req, res) => {
    res.redirect("/login");
})

//-----------------------------------------------------------------------------------------------------------------------------------------------

// login....

app.get("/login", (req, res) => { // jokhon "/login" er modhe login kei render korchi tokhon form er action "/login" deoyar dorkar nei 
    res.render("login");
})

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
        return res.render("notregister");
    }
    else {
        const ispassmatch = await bcrypt.compare(password, user.password); // ai bcrypt.compare() function use kore ami login form a deoya password and database store hoya encode password match kore deklam.....jodi match hoi true return korbe and login hobe.....jodi match na kore false retrn korbe incorect password message debe......
        // ai function ta use korte holo karon db te store houya password ta encoded form a ache.....ar login form a je password ta dobo ota decoded(normal) tai ai function ta use kortei hobe.......
        // await dilam karon ata je output(true,false) dbe......tar opor nirvor kore next line code cholbe.....tai jotokhon na ai line ta chole output(true,false) debe totokhon porer line cholbe na.....
        if (!ispassmatch) {
            return res.render("login", { email, message: "Incorect Password" });
        }
        else {
            const token = jwt.sign({ _id: user._id }, "abcdefgh");
            res.cookie("token", token, {
                httpOnly: true,
                expires: new Date(Date.now() + 60 * 1000)
            })
            res.redirect("/");
        }
    }
})

app.get("/notregister", (req, res) => {
    res.redirect("/register");
})

//-----------------------------------------------------------------------------------------------------------------------------------------------

// logout....

app.get("/logout", (req, res) => {
    res.cookie("token", null, {
        httpOnly: true,
        expires: new Date(Date.now())
    })
    res.redirect("/");
})

//------------------------------------------------------------------------------------------------------------------------------------------------

// server listener....

app.listen(5000, () => console.log("server is working"));