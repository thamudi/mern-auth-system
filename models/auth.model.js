'use strict';
/* 
------------------ 
Model Dependencies
------------------ 
*/
const mongoose = require('mongoose');
const crypto = require('crypto');

/* 
------------------ 
User Schema
------------------ 
*/
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        trim: true,
        require: true,
        unique: true,
        lowercase: true
    },
    name: {
        type: String,
        trim: true,
        required: true
    },
    hashed_password: {
        type: String,
        required: true
    },
    salt: String,// TODO: check
    role: {
        type: String,
        default: 'user'
    },
    reset_password_link: {
        data: String,
        default: ''
    }
}, { timeStamp: true });

// virtual password 
//TODO: check
userSchema.virtual('password').set(function (password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashed_password = this.encryptPassword(password);
}).get(function () {
    return this._password
});


/* 
------------------ 
User Schema Methods
------------------ 
*/
userSchema.methods = {

    // Generate salt
    makeSalt: function () {
        return Math.round(new Date().valueOf() * Math.random()) + ''
    },

    // Encrypt Password
    encryptPassword: function (password) {
        if (!password) return '';
        try {
            return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
        } catch (error) {
            return '';
        }
    },

    //Compare password between plain and get user hashed password
    authenticate: function (plainPassword) {
        return this.encryptPassword(plainPassword) === this.hashed_password;
    }
}

module.exports = mongoose.model('User', userSchema);