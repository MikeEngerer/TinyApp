//dependancies/global vars/express init

var express = require('express');
var urlDB = require('./urlDB');
var userDB = require('./userDB');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
var app = express();

var PORT = 8080;
let shortenedURL;

//body parser is a middleware used to parse content retrieved from the body
app.use(bodyParser.urlencoded({extended: true}));
// cookie parser parses cookies from req for reading 
app.use(cookieParser());

function findUserByEmail(emailInput) {
	for (user_id in userDB) {
		if (userDB[user_id].email === emailInput) {
			return true;
		}
	}
	return false;
}

function findUserByPassword(passwordInput) {
	for (user_id in userDB) {
		if (userDB[user_id].password === passwordInput) {
			return true;
		}
	}
	return false;
}

function findUserIdByEmail(emailInput) {
	for (user_id in userDB) {
		if (userDB[user_id].email === emailInput) {
			return userDB[user_id].id
		}
	}
	return false;
}

// generates random string of chars(a-z A-Z 0-9) with len of 6
function generateRandomString() {
	let str = ""
	let chars = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM0123456789";
	for (let i = 0; i < 6; i++) {
		let randomIndex = Math.floor(Math.random() * chars.length);
		str += chars[randomIndex];
	}
	return str;
}
// set to inclue ejs engine
app.set('view engine', 'ejs');

// Home route
app.get('/', function(req, res) {
	res.send('Hello World! This website is a work in progress :)')
})

//// other routes
// urls_new is rendered when urls/new is visited -- URL input form is presented
app.get("/urls/new", (req, res) => {
	let user_id = req.cookies.user_id
	let templateVars = { user_id: userDB[user_id]  }
	res.render("urls_new", templateVars);
});
// post request from URL input form -- response get sent to urlDB then redirects user to urls_show
app.post("/urls", (req, res) => {
	shortenedURL = generateRandomString();
	urlDB[shortenedURL] = req.body.longURL;
	res.redirect(`/urls/${shortenedURL}`)
})
// gets redirected in response to inputting a valid shortURL in the form localhost:8080/u/:shortURL
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDB[req.params.shortURL];
  res.redirect(longURL);
});
// renders urls_index -- currently unused?
app.get("/urls", function(req, res) {
	let user_id = req.cookies.user_id
  let templateVars = { user_id: userDB[user_id], urls: urlDB };
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
	let user_id = req.cookies.user_id
	let templateVars = { user_id: userDB[user_id] }
	res.render("register");
})

app.post("/register", (req, res, next) => {
	if (req.body.email === "" || req.body.password === "") {
		res.status(400);
		res.send("Email or password field blank. Please go back and try again.")
		return;
	} else if (findUserByEmail(req.body.email)) {
		res.status(400);
		res.send("Email already exists. Please go back and try again.")
		return;
	}
	let randomId = generateRandomString();
	userDB[randomId] = { 
		id: randomId, 
		email: req.body.email, 
		password: req.body.password 
	}

	res.cookie("user_id", randomId)
		console.log(userDB)
	res.redirect("/urls")
})
// currently unused?
app.get("/urls/:id", (req, res) => {
	let shortURL = req.params.id
	let user_id = req.cookies.user_id
  	let templateVars = { user_id: userDB[user_id], shortURL, longURL: urlDB[shortURL] };
  	res.render("urls_show", templateVars);
});
// deletes record of saved URL
app.post("/urls/:id/delete", (req, res) => {
	let id = req.params.id;
	delete urlDB[id]
	res.redirect("/urls")
})
// post route to allow for edit/update of longURL --shortURL remains unchanged
app.post("/urls/:id", (req, res) => {
	let id = req.params.id;
	urlDB[id] = req.body.update
	res.redirect(`/urls/${id}`)
})

app.get("/login", (req, res) => {
	res.render("login")
})

app.post("/login", (req, res) => {
	let email = req.body.email;
	let password = req.body.password;
	console.log(email, password)
	console.log(findUserByEmail(email), findUserByPassword(password))
	console.log(findUserIdByEmail(email))
	if (findUserByEmail(email) && findUserByPassword(password)) {
		res.cookie("user_id", findUserIdByEmail(email))
		res.redirect('/urls');
	} else {
		res.status(403)
		res.send("Invalid email and/or password. Please try again.")
	}

})
// after submitting logout form, user's cookie is cleared and they are redirected to /urls
app.post("/logout", (req, res) => {
	res.clearCookie("user_id")
	res.redirect("/urls")
})
// JSON of URLS
app.get("/urls.json", (req, res) => {
 	res.json(urlDB);
});

// test route (hello world)
app.get("/hello", (req, res) => {
 	res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// app request listening
app.listen(PORT, function() {
	console.log(`listening on port: ${PORT}!`)
})
