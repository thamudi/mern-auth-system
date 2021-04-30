'use strict';
/* 
------------------ 
Server Dependencies
------------------ 
*/
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectDb = require('./config/db');
// Config dotenv to see the path to ./config/config.env
require('dotenv').config({ path: './config/config.env' });

/* 
------------------ 
Server Setup
------------------ 
*/
// Connect to DB
connectDb();
// Initialize express instance
const app = express();
// Load routes
const authRouter = require('./routes/auth.route');
const userRouter = require('./routes/user.route')
// Get port from env config
const PORT = process.env.PORT;
// Development config
if (process.env.NODE_ENV === 'development') {
    app.use(cors({
        origin: process.env.CLIENT_URL
    }));

    app.use(morgan('dev'));
    // Morgan will be used to give info about each request
    // Cors will be used to enable us to work with react localhost on port 3000 without any issues.
}

/* 
------------------ 
Express Middleware
------------------ 
*/
// Use bodyParser 
app.use(bodyParser.json());
// Use Routes
app.use('/api/', authRouter);
app.use('/api/', userRouter);
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: "Page Not Found"
    });
});

// App start
app.listen(PORT, () => {
    console.log('======================================');
    console.info(`Server started on port: ${PORT}`);
    console.info(`Node Env: ${process.env.NODE_ENV}`);
    console.info(`Client URL: ${process.env.CLIENT_URL}`);
});