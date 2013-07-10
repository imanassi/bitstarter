var express = require('express');
var fs = require('fs');

var app = express();

app.get('/', function(request, response) {
	var result = fs.readFileSync('./index.html');
	console.log(result.toString());
	response.send(result.toString());
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
	console.log("Listening on " + port);
});
