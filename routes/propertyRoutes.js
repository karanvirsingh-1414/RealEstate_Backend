const express = require('express');
const fs = require('fs');
const path = require('path');
const createError = require('http-errors');

const router = express.Router();
const propertiesFile = path.join(__dirname, '../properties.json');

// Utility functions
const readProperties = () => {
    if (!fs.existsSync(propertiesFile)) return [];
    return JSON.parse(fs.readFileSync(propertiesFile));
};

const writeProperties = (properties) => {
    fs.writeFileSync(propertiesFile, JSON.stringify(properties, null, 2));
};

// Route: Add Property (GET)
router.get('/add', (req, res, next) => {
    if (!req.session.user) {
        return next(createError(500, 'Access denied. Please login first.'));
    }
    res.render('addProperty');
});

// Route: Add Property (POST)
router.post('/add', (req, res, next) => {
    const { title, location, price, description } = req.body;

    if (!req.session.user) {
        return next(createError(500, 'Unauthorized attempt to add property.'));
    }

    const properties = readProperties();
    properties.push({ title, location, price, description });
    writeProperties(properties);

    res.redirect('/properties/view');
});

// Route: View Properties
router.get('/view', (req, res, next) => {
    if (!req.session.user) {
        return next(createError(500, 'Unauthorized access! Please login first.'));
    }
    const properties = readProperties();
    res.render('viewProperty', { properties });
});

module.exports = router;
