'use strict';
const express = require('express');
const router = express.Router();

// Load Controllers
const {
    registerController,
    activationController,
    signinController,
    forgotPasswordController,
    resetPasswordController,

} = require('../controller/auth.controller');

// Load Helpers

const {
    validSign,
    validLogin,
    forgotPasswordValidator,
    resetPasswordValidator
} = require('../helpers/validators');

router.post('/register', validSign, registerController);
router.post('/activation', activationController);
router.post('/login', validLogin, signinController,);
router.put('/forgotpassword', forgotPasswordValidator, forgotPasswordController);
router.put('/resetpassword', resetPasswordValidator, resetPasswordController);

module.exports = router;