var express = require('express');
var urlDB = require('./urlDB');
const bodyParser = require("body-parser");
var app = express();
var PORT = 8080;
let shortenedURL;

app.use(bodyParser.urlencoded({extended: true}));

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
	res.send('Hello World!')
})

//// other routes
// urls_new is rendered when urls/new is visited -- URL input form is presented
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});
// post request from URL input form -- response get sent to urlDB then redirects user to urls_show
app.post("/urls", (req, res) => {
	console.log(req.body.longURL)
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
  let templateVars = { urls: urlDB };
  res.render("urls_index", templateVars);
});
// currently unused?
app.get("/urls/:id", (req, res) => {
	let x = req.params.id
  	let templateVars = { shortURL: req.params.id, longURL: urlDB[x] };
  	res.render("urls_show", templateVars);
});
// deletes record of saved URL
app.post("/urls/:id/delete", (req, res) => {
	let id = req.params.id;
	delete urlDB[id]
	res.redirect("/urls")
})

app.post("/urls/:id", (req, res) => {
	let id = req.params.id;
	urlDB[id] = req.body.update
	res.redirect(`/urls/${id}`)
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
