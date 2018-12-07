//dependancies/global vars/express init

const express = require('express');
let urlDB = require('./urlDB');
let userDB = require('./userDB');
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require("bcrypt");
const app = express();

var PORT = 8080;

//body parser is a middleware used to parse content retrieved from the body
app.use(bodyParser.urlencoded({extended: true}));
// cookie parser parses cookies from req for reading 
app.use(cookieSession({
	name: 'session',
	keys: ["hi"],
	maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
//returns bool if/else email input is === to emain in userDB
function findUserByEmail(emailInput) {
	for (user_id in userDB) {
		if (userDB[user_id].email === emailInput) {
			return true;
		}
	}
	return false;
};
// returns bool if/else pass input === hashed pass in urlDB
function findUserByPassword(passwordInput) {
	for (user_id in userDB) {
		if (bcrypt.compareSync(passwordInput, userDB[user_id].password)) {
			return true;
		}
	}
	return false;
};
// returns id of user from email input
function findUserIdByEmail(emailInput) {
	for (user_id in userDB) {
		if (userDB[user_id].email === emailInput) {
			return userDB[user_id].id;
		}
	}
	return false;
};
// returns new object containing subset of urls from urlDB which belong to user 
function findUsersUrls(user) {
	var urlSubset = {};
	for (url in urlDB) {
		if (user === urlDB[url].user_id) {
			urlSubset[url] = urlDB[url];
		}
	}
	return urlSubset;
};
// generates random string of chars(a-z A-Z 0-9) with len of 6
function generateRandomString() {
	let str = "";
	let chars = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM0123456789";
	for (let i = 0; i < 6; i++) {
		let randomIndex = Math.floor(Math.random() * chars.length);
		str += chars[randomIndex];
	}
	return str;
};
// set to inclue ejs engine
app.set('view engine', 'ejs');

// Home route --redirect to /urls if logged in, /login if not
app.get('/', function(req, res) {
	if (req.session.user_id) {
		res.redirect("/urls");
	} else {
		res.redirect("/login");
	}
});

//// other routes
// urls_new is rendered when urls/new is visited -- URL input form is presented
// only renders if user is logged in... else redirected to login page
app.get("/urls/new", (req, res) => {
	let user_id = req.session.user_id;
	let templateVars = { user_id: userDB[user_id]  };
	if (user_id) {
		res.render("urls_new", templateVars);
	} else {
		res.redirect("/login");
	}
});
// post request from URL input form -- response get sent to urlDB then redirects user to urls_show of shortenedURL
//new url record is output to urlDB
app.post("/urls", (req, res) => {
	let shortenedURL = generateRandomString();
	let user_id = req.session.user_id;
	let longURL = urlDB[shortenedURL["longURL"]];
	urlDB[shortenedURL] = {longURL: null, user_id: null};
	urlDB[shortenedURL].longURL = req.body.longURL;
	urlDB[shortenedURL].user_id = user_id;
	res.redirect(`/urls/${shortenedURL}`);
});
// gets redirected in response to inputting a valid shortURL in the form localhost:8080/u/:shortURL
app.get("/u/:shortURL", (req, res) => {
	let longURL = urlDB[req.params.shortURL].longURL;
	res.redirect(longURL);
});
// get for urls main page -- display differs based on logged in/out 
// urls set to null if logged out -- does not display index of urls
app.get("/urls", function(req, res) {
	let user_id = req.session.user_id;
	if (user_id) {
		let templateVars = { user_id: userDB[user_id], urls: findUsersUrls(user_id) };
		res.render("urls_index", templateVars);
	} else {
		let templateVars = { user_id: userDB[user_id], urls: null };
		res.render("urls_index", templateVars);
	}

});
// registration page -- new users get added to userDB through app.post-> /register
app.get("/register", (req, res) => {
	let user_id = req.session.user_id;
	let templateVars = { user_id: userDB[user_id] };
	if (user_id) {
		res.redirect("/urls")
	} else {
		res.render("register");
	}
});
// addition of new users to userDB
// checks for blank fields and emails already in use
// if success, pass is hashed and cookie is set
app.post("/register", (req, res) => {
	if (req.body.email === "" || req.body.password === "") {
		res.status(400).send("Email or password field blank. Please go back and try again.");
		return;
	} else if (findUserByEmail(req.body.email)) {
		res.status(400).send("Email already exists. Please go back and try again.");
		return;
	} else {
		let randomId = generateRandomString();
		userDB[randomId] = { 
			id: randomId, 
			email: req.body.email, 
			password: bcrypt.hashSync(req.body.password, 10)
		};
		req.session.user_id = randomId;
		res.redirect("/urls");
	}
});
// redirection route following app.post of new url -- urls_show rendered in differing formats depending on login status
app.get("/urls/:id", (req, res) => {
	let shortURL = req.params.id;
	let user_id = req.session.user_id;
  	if (!urlDB[shortURL]) {
  		res.status(404).send("Page does not exist.")
  	}
  	let templateVars = { user_id: userDB[user_id], shortURL, longURL: urlDB[shortURL].longURL };
  	let urlSubset = findUsersUrls(user_id);
  	for (url in urlSubset) {
  		if (url === shortURL) {
  			return res.render("urls_show", templateVars);
  		}
  	}
  	res.status(403).send("You do not have permission to view this URL record.");
  
});
// deletes record of saved URL
app.post("/urls/:id/delete", (req, res) => {
	let shortURL = req.params.id;
	let user_id = req.session.user_id;
	delete urlDB[shortURL];
	res.redirect("/urls");
});
// post route to allow for edit/update of longURL --shortURL remains unchanged
app.post("/urls/:id", (req, res) => {
	let shortURL = req.params.id;
	let longURL = urlDB[shortURL["longURL"]];
	urlDB[shortURL].longURL = req.body.update;
	res.redirect(`/urls`)
});
// destination for /login redirects -- renders login page
app.get("/login", (req, res) => {
	let user_id = req.session.user_id
	if (user_id) {
		res.redirect("/urls")
	} else {
		res.render("login");
	}
});
// login post destination -- checks for email/pass authenticity and returns err 403 if invalid
app.post("/login", (req, res) => {
	let email = req.body.email;
	let password = req.body.password;
	if (findUserByEmail(email) && findUserByPassword(password)) {
		req.session.user_id = findUserIdByEmail(email);
		res.redirect('/urls');
	} else {
		res.status(403);
		res.send("Invalid email and/or password. Please try again.");
	}
});
// after submitting logout form, user's cookie is cleared and they are redirected to /urls
app.post("/logout", (req, res) => {
	req.session.user_id = null;
	res.redirect("/urls");
});
// JSON of urlDB
app.get("/urls.json", (req, res) => {
 	res.json(urlDB);
});

// app request listening
app.listen(PORT, function() {
	console.log(`listening on port: ${PORT}!`);
});
