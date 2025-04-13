const express = require("express");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const path = require("path");
const createError = require("http-errors");
const morgan = require("morgan");

const app = express(); // ✅ YEH LINE ZARURI THI

app.use(morgan("dev")); // ✅ Logging har request ke liye

const PORT = process.env.PORT || 3000;

const usersFile = path.join(__dirname, "users.json");
const featuredPropertiesFile = path.join(__dirname, "featuredProperties.json");
const addedPropertiesFile = path.join(__dirname, "addedProperties.json");

const propertyRoutes = require("./routes/propertyRoutes");

app.use(session({ secret: "realestate_secret", resave: false, saveUninitialized: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");



// JSON File Helpers
// Blocking Operations

// ye file ko read krta hai or jbtk puri file read nhi hojati tbtk read krte rehta hai, iski vjh se koi or code ki execution nhi ho pati isliye isko blocking operation kehte h
const readFile = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : []);

// ye file ko write krta hai or jbtk puri file write nhi hojati tbtk write krte rehta hai, iski vjh se koi or code ki execution nhi ho pati isliye isko blocking operation kehte h
const writeFile = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// Routes
app.use("/properties", propertyRoutes);

// Landing Page
app.get("/", (req, res) => {
    const featuredProperties = readFile(featuredPropertiesFile);
    res.render("landing", { properties: featuredProperties });
});

// Register
app.get("/register", (req, res) => res.render("register", { error: null }));

app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    const users = readFile(usersFile);

    if (users.some(user => user.username === username)) {
        return res.render("register", { error: "User already exists! Try another username." });
    }


    // Non Blocking operation - bcrypt.hash ek non blocking operation hai kyunki ye passwords ko encrypt krne ke kaam aata hai, or jbtk ye kaam ho rha hota hai tbtk hm dusre operations bhi execute kr skte hai iski vjh se operations ruk nhi jate or server ki speed tez hoti h
    users.push({ username, password: await bcrypt.hash(password, 10) });
    writeFile(usersFile, users);
    res.redirect("/login");
});

// Login
app.get("/login", (req, res) => res.render("login", { error: null }));

app.post("/login", async (req, res, next) => {
    const { username, password } = req.body;
    const users = readFile(usersFile);
    const user = users.find(user => user.username === username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.render("login", { error: "Invalid username or password!" });
    }

    req.session.user = username;
    res.redirect("/dashboard");
});




// Dashboard (Unprotected by default for demo)
// app.get("/dashboard", (req, res) => {
//     res.render("index", { username: req.session.user });
// });






// Add Property (Backend handler only — frontend form in propertyRoutes)
app.post("/properties/add", (req, res, next) => {
    if (!req.session.user) return next(createError(500, "Unauthorized. Please login to add properties."));

    const { title, location, price, size, image, link } = req.body;
    const addedProperties = readFile(addedPropertiesFile);

    addedProperties.push({
        id: addedProperties.length + 1,
        title,
        location,
        price,
        size,
        image: image || "/images/default.jpg",
        link: link || "#"
    });

    writeFile(addedPropertiesFile, addedProperties);
    res.redirect("/dashboard");
});

// Logout
app.get("/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/"));
});

// Crash test route
app.get("/crash-test", (req, res) => {
    throw new Error("Deliberate crash");
});



app.get("/dashboard", (req, res, next) => {
    if (!req.session.user) {
        return next(createError(500, "Access denied. Please login first."));
    }
    res.render("index", { username: req.session.user });
});

// 404 Handler (for all unknown routes)
app.use((req, res) => {
    res.status(404).render("404", { url: req.originalUrl });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.status || 500;
    res.status(statusCode).render("error", {
        status: statusCode,
        message: err.message || "Something went wrong!",
    });
});

// Server
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
