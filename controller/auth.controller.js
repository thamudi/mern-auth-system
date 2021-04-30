'use strict';
/* 
------------------ 
Controller Dependencies
------------------ 
*/
//TODO: check these dep
const User = require('../models/auth.model');
const expressJWT = require('express-jwt');
const _ = require('lodash');
const { OAuth2Client } = require('google-auth-library');
const fetch = require('node-fetch');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { errorHandler } = require('../helpers/dbErrorHandling');
// TODO: move to a different file
const path = require('path');
const nodemailer = require("nodemailer");
const hbs = require('nodemailer-express-handlebars');

exports.registerController = (req, res) => {
    const { name, email, password } = req.body;
    const error = validationResult(req);

    if (!error.isEmpty()) {
        const firstError = errors.array().map(error => error.msg)[0];
        return res.status(422).json({
            error: firstError
        })
    } else {
        // Check if user Email already exists
        User.findOne({ email }).exec((err, user) => {
            if (user) {
                return res.status(400).json({
                    errors: 'Email is taken'
                });
            }
        });

        // Generate Token
        const token = jwt.sign(
            {
                name,
                email,
                password
            },
            process.env.JWT_ACCOUNT_ACTIVATION,
            {
                expiresIn: '5m'
            }
        );

        // TODO: Move nodemailer transporter to another file
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASS,
            },
        });
        transporter.use(
            "compile",
            hbs({
                viewEngine: {
                    extName: ".hbs",
                    partialsDir: path.resolve(__dirname, "../views/"),
                    defaultLayout: false,
                },

                viewPath: path.resolve(__dirname, "../views/"),

                extName: ".hbs",
            })
        );
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: `Account activation link`,
            template: "activate-link-email",
            context: { token: token, clientUrl: process.env.CLIENT_URL },
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                return res.status(400).json({
                    success: false,
                    errors: errorHandler(error)
                });
            } else {
                return res.json({
                    message: `Email has been sent to ${email}`
                });
            }
        });
    };

}