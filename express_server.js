//dependancies/global vars/express init

var express = require('express');
var urlDB = require('./urlDB');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
var app = express();

var PORT = 8080;
let shortenedURL;

//body parser is a middleware used to parse content retrieved from the body
app.use(bodyParser.urlencoded({extended: true}));
// cookie parser parses cookies from req for reading 
app.use(cookieParser());

// generates random string of chars(a-z A-Z 0-9) with len of 6
function generateRandomString() {
	let str = ""
	let chars = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM0123456789";
	for (let i = 0; i < 6; i++) {
		let randomIndex = Math.floor(Math.random() * chars.length);
		console.log(randomIndex)
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
	let templateVars = { username: req.cookies["username"] }
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
  let templateVars = { username: req.cookies["username"], urls: urlDB };
  res.render("urls_index", templateVars);
});
// currently unused?
app.get("/urls/:id", (req, res) => {
	let shortURL = req.params.id
  	let templateVars = { username: req.cookies["username"], shortURL: shortURL, longURL: urlDB[shortURL] };
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
// after submitting login form, cookie gets set with credentials and user is redirected to /urls
app.post("/login", (req, res) => {
	let username = req.body.username;
	res.cookie("username", username);
	res.redirect('/urls');
})
// after submitting logout form, user's cookie is cleared and they are redirected to /urls
app.post("/logout", (req, res) => {
	res.clearCookie("username")
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

