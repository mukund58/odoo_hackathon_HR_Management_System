//create server
const express = require('express');
const app = express();
const router = require('./routes/auth');
const cookieParser = require('cookie-parser');
//middlware
app.use(express.json());
app.use(cookieParser());

app.get('/', (req,res)=>{
    res.send("hey server is running now!");
})
app.use('/api/auth', router);


//app.use('/api/incidents', incidentRoutes);


module.exports = app;