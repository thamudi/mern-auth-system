'use strict';
const express = require('express');
const router = express.Router();

// Load Controllers
const {
    registerController,

} = require('../controller/auth.controller')
router.post('/register', registerController);

module.exports = router;