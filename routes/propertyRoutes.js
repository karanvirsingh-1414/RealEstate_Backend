const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const propertiesFile = path.join(__dirname, '../properties.json');

// Read properties from file
const readProperties = () => {
    if (!fs.existsSync(propertiesFile)) return [];
    return JSON.parse(fs.readFileSync(propertiesFile));
};

// Write properties to file
const writeProperties = (properties) => {
    fs.writeFileSync(propertiesFile, JSON.stringify(properties, null, 2));
};

// GET - Add Property Page
router.get('/add', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login'); // Ensure the user is logged in
    }
    res.render('addProperty');
});

// POST - Add Property
router.post('/add', (req, res) => {
    const { title, location, price, description } = req.body;
    const properties = readProperties();

    properties.push({ title, location, price, description });
    writeProperties(properties);

    res.redirect('/properties/view');
});

// GET - View Properties
router.get('/view', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login'); // Ensure the user is logged in
    }
    const properties = readProperties();
    res.render('viewProperty', { properties });
});

module.exports = router;
