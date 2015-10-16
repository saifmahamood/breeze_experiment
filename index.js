var express = require('express');
var app = express();


var users = {
	saif: {payments: 0, fees: 0}
};

app.post('/adduser', function(req,res) {
  console.log(users);
  var payments = req.query.payments;
  var fees = req.query.fees;
  users[req.query.user_id] = {payments, fees};
  console.log(users);
  res.send(users);
})

app.post('/users/:user_id/items', function(req, res) {
	if (users[req.params.user_id]) {
		var user = users[req.params.user_id];
		res.send({user: user});
		// Here comes all your calculation, update the user
		// Checking if he is in threshold
		// Make your trello calls
	}
	else res.send("No user by id: " + req.params.user_id + " exists");
});



var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
