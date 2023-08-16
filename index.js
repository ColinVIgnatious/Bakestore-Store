require('dotenv').config();
const path = require("path");
const user_route = require("./routes/userRoute");
const admin_route = require("./routes/admin");
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require("express-session");
const expresslayouts = require("express-ejs-layouts");
const bcrypt = require("bcrypt");
const express = require("express");
const app = express();
const db = require("./config/connection")
db.connect(err => {
	if (err) console.log("Database connection failed")
}) 

app.set('view engine','ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expresslayouts);
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // Set to true if using HTTPS
      maxAge: 86400000 // Set the expiration time in milliseconds
    }
  }));
app.use('/', user_route);
app.use('/admin', admin_route);


// Define the error handling middleware
app.use(( req, res, next) => {
  // Check if the user is an admin based on some criteria (e.g., user role)
  const isAdmin = req.session.admin && req.session.admin.isAdmin;
  // Render the appropriate error page based on the user's role
  // console.log(err)
  if (isAdmin) {
    // Render admin error pages
    switch (res.statusCode) {
      case 404:
        res.status(404).render("admin/404");
        break;
      case 400:
        res.status(400).render("admin/400");
        break;
      case 500:
        res.status(500).render("admin/500");
        break;
      default:
        res.status(res.statusCode).render("admin/404");
        // send("Something went wrong.");
    }
  } else {
    // Render user error pages
    switch (res.statusCode) {
      case 404:
        res.status(404).render("users/404");
        break;
      case 400:
        res.status(400).render("users/400");
        break;
      case 500:
        res.status(500).render("users/500");
        break;
      default:
        res.status(res.statusCode).render("users/404");
        // send("Something went wrong.");
    }
  }
});

app.listen(3000,function(){
    console.log("Server is running...");
});

