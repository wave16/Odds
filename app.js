var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');

var Users = require('./models/users.js');

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/odds', function(err) {
    if(err) {
        console.log('connection error', err);
    } else {
        console.log('connection successful');
    }
});

//==================================================================
// Define the strategy to be used by PassportJS
passport.use('local-login', new LocalStrategy({
	
	usernameField : 'email',
    passwordField : 'password',
    passReqToCallback : true
},
	function(req, email, password, done) {
	
		Users.findOne({ 'email' :  email }, function(err, user) {
            
            if (err) {
				console.log(err);
				return done(err);
			}

            if (!user) {
				console.log("No user");
				return done(null, false); 
			}
                
            
            if (!user.validPassword(password)) {
				console.log("Invalid password");
				return done(null, false);
			}
			
            return done(null, user);
        });
  }
));

// Serialized and deserialized methods when got from session
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

var routes = require('./routes/index');

var app = express();

app.engine("html", require('ejs').renderFile);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'salainensana' }));
app.use(passport.initialize()); // Add passport initialization
app.use(passport.session());    // Add passport initialization

app.use('/', routes);

app.get('/login', function(req, res, next) {
  res.render('login', {});
});

app.post('/login', passport.authenticate('local-login', {	
    successRedirect : '/', // redirect to the secure profile section
    failureRedirect : '/login', // redirect back to the signup page if there is an error    
}));

// route to log out
app.post('/logout', function(req, res){
  req.logOut();
  res.sendStatus(200);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
