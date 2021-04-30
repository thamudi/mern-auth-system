'use strict';
/* 
------------------ 
Controller Dependencies
------------------ 
*/
//TODO: check these dep
const User = require('../models/auth.model');
const expressJwt = require('express-jwt');
const _ = require('lodash');
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

};

exports.activationController = (req, res) => {
    const { token } = req.body;

    if (token) {
        jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, (err, decoded) => {
            if (err) {
                console.log('Activation error');
                return res.status(401).json({
                    errors: 'Expired Link, Sign Up again'
                });
            } else {
                const { name, email, password } = jwt.decode(token);

                // Create a new User
                const user = new User({
                    name,
                    email,
                    password
                });

                user.save((err, user) => {
                    if (err) {
                        console.log('Save Error', errorHandler(err));
                        return res.status(401).json({
                            errors: errorHandler(error)
                        });
                    } else {
                        return res.json({
                            success: true,
                            message: user,
                            message: 'Signup Success'
                        });
                    }
                });
            }
        });
    } else {
        return res.json({
            message: 'error occurred, please try again'
        });
    }
};

exports.signinController = (req, res) => {

    const { email, password } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const firstError = errors.array().map(error => error.msg)[0];
        return res.status(422).json({
            errors: firstError
        });
    } else {
        User.findOne({ email }).exec((err, user) => {
            if (err || !user) {
                return res.status(400).json({
                    errors: 'User with that email does not exist. Please Signup'
                });
            }
            // authenticate 
            if (!user.authenticate(password)) {
                return res.status(400).json({
                    errors: 'Email and password do not match'
                });
            }
            // generate a token and send to client
            const token = jwt.sign(
                {
                    _id: user._id
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: '7d'
                }
            );

            const { _id, name, email, role } = user;
            return res.json({
                token,
                user: {
                    _id,
                    name,
                    email,
                    role
                }
            });
        });
    }
};

exports.forgotPasswordController = (req, res) => {
    const { email } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const firstError = errors.array().map(error => error.msg)[0];
        return res.status(422).json({
            error: firstError
        });
    } else {
        User.findOne(
            {
                email
            }, (err, user) => {
                if (err || !user) {
                    return res.status(400).json({
                        error: 'User with that email does not exists'
                    });
                }

                const token = jwt.sign(
                    {
                        _id: user._id
                    },
                    process.env.JWT_RESET_PASSWORD,
                    {
                        expiresIn: '10m'
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
                    subject: `Reset Password Link`,
                    template: "reset-password-link",
                    context: { token: token, clientUrl: process.env.CLIENT_URL },
                };

                return user.updateOne(
                    {
                        reset_password_link: token
                    },
                    (err, success) => {
                        if (err) {
                            console.log('RESET PASSWORD LINK ERROR', err);
                            return res.status(400).json({
                                error:
                                    'Database connection error on user password forgot request'
                            });
                        } else {
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
                        }
                    }
                );

            }
        );
    }
};

exports.resetPasswordController = (req, res) => {
    const { resetPasswordLink, newPassword } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const firstError = errors.array().map(error => error.msg)[0];
        return res.status(422).json({
            errors: firstError
        });
    } else {
        if (resetPasswordLink) {
            jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD, function (
                err,
                decoded
            ) {
                if (err) {
                    return res.status(400).json({
                        error: 'Expired link. Try again'
                    });
                }

                User.findOne(
                    {
                        reset_password_link: resetPasswordLink
                    },
                    (err, user) => {
                        if (err || !user) {
                            return res.status(400).json({
                                error: 'Something went wrong. Try later'
                            });
                        }

                        const updatedFields = {
                            password: newPassword,
                            resetPasswordLink: ''
                        };

                        user = _.extend(user, updatedFields);

                        user.save((err, result) => {
                            if (err) {
                                return res.status(400).json({
                                    error: 'Error resetting user password'
                                });
                            }
                            res.json({
                                message: `Great! Now you can login with your new password`
                            });
                        });
                    }
                );
            });
        }
    }
};


exports.requireSignin = expressJwt({
    secret: process.env.JWT_SECRET, // req.user._id
    algorithms: ['sha1', 'RS256', 'HS256']
});

exports.adminMiddleware = (req, res, next) => {
    User.findById({
        _id: req.user._id
    }).exec((err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: 'User not found'
            });
        }

        if (user.role !== 'admin') {
            return res.status(400).json({
                error: 'Admin resource. Access denied.'
            });
        }

        req.profile = user;
        next();
    });
};