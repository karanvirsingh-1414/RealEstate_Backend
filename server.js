const express = require("express");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// File paths
const usersFile = path.join(__dirname, "users.json");
const featuredPropertiesFile = path.join(__dirname, "featuredProperties.json");
const addedPropertiesFile = path.join(__dirname, "addedProperties.json");

// Routes
const propertyRoutes = require("./routes/propertyRoutes");

// Middleware
app.use(session({ secret: "realestate_secret", resave: false, saveUninitialized: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// Use property routes for '/properties'
app.use("/properties", propertyRoutes);

// 📌 **Read & Write Utility Functions**
const readFile = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : []);
const writeFile = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// 🏡 **Landing Page (Featured Properties Only)**
app.get("/", (req, res) => {
    const featuredProperties = readFile(featuredPropertiesFile);
    res.render("landing", { properties: featuredProperties });
});

// 📝 **Register Page (GET)**
app.get("/register", (req, res) => res.render("register", { error: null }));

// 📝 **Register User (POST)**
app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    const users = readFile(usersFile);

    if (users.some(user => user.username === username)) {
        return res.render("register", { error: "⚠️ User already exists! Try another username." });
    }

    users.push({ username, password: await bcrypt.hash(password, 10) });
    writeFile(usersFile, users);
    res.redirect("/login");
});

// 🔐 **Login Page (GET)**
app.get("/login", (req, res) => res.render("login", { error: null }));

// 🔐 **Login User (POST)**
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const users = readFile(usersFile);
    const user = users.find(user => user.username === username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.render("login", { error: "❌ Invalid username or password!" });
    }

    req.session.user = username;
    res.redirect("/dashboard");
});

// 🏠 **Dashboard (Protected)**
app.get("/dashboard", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    res.render("index", { username: req.session.user });
});

// ➕ **User-Added Properties Page**
app.get("/properties/view", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    const addedProperties = readFile(addedPropertiesFile);
    res.render("viewProperties", { properties: addedProperties });
});

// ➕ **Add Property (POST)**
app.post("/properties/add", (req, res) => {
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

// 🚪 **Logout**
app.get("/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/"));
});

// 🚀 **Start Server**
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
