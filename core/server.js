// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express           = require('express');        // call express
var app               = express();                 // define our app using express
var bodyParser        = require('body-parser');
var expressValidator  = require('express-validator');
var morgan            = require('morgan');
var jwt               = require('jsonwebtoken');
var settings          = require('../settings');
var db                = require('../core/db');
var httpMsgs          = require('../core/httpMsgs');
var member            = require('../app/controllers/member');
var authn             = require('../app/controllers/authenticate');


// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ type: 'application/json' }));
app.use(expressValidator());
app.use(morgan('dev'));

var port = process.env.PORT || settings.webPort;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:3000/api)
router.get('/', function(req, res) {
    res.json({ message: 'Degnon Associates Member Interface API' });   
});

// Authenticate User (POST http://localhost:3000/api/authenticate)
router.post('/authenticate', function (req, res) {
	authn.getAuthn(req, res)
});


router.use(function (req, res, next) { 

	// check post, url params, or header for token
	var token = req.body.token || req.query.token || req.headers['x-access-token'];
	

	// decode token
	if (token) {
		// verify secret and check exp
		jwt.verify(token, settings.secret, function (err, decoded) {
			if (err) {
				httpMsgs.show400(req, res);
			} else {
				// authn passed, save to request for use in other routes
				req.decoded = decoded;
				next();
			}
		});
	} else {
		// if no token is passed return an error
		httpMsgs.show403(req, res);
	}

	// member GET all POST routes
	router.route('/members')
		.get(function (req, res) {
			member.getList(req, res);
		})
		.post(function (req, res) { 
			member.add(req, res);
	});

	// member GET one PUT DELETE routes
	router.route('/members/:memberId')
		.get(function (req, res) { 
			var memIdPatt = "[0-9]+";
			var patt = new RegExp("/members/" + memIdPatt);
			if (patt.test(req.url)) {
				patt = new RegExp(memIdPatt);
				var memberId = patt.exec(req.url);
				member.get(req, res, memberId);
			} else {
				httpMsgs.show404(req, res);
			}
		})
		.put(function (req, res) {
			member.update(req, res);
		})
		.delete(function (req, res) {
			member.delete(req, res);
	});
});



// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Started listening at ' + port);

