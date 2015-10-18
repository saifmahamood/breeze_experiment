var express = require('express');
var app = express();
var Trello = require("node-trello");
var t = new Trello("e7b78f08bba6e897951d2cecf7fa8ab2", "f0abcacb026aae2e87623f7fd660745e2527cf4fd6e983f65570ae98b9e4b2e7");
var now = new Date();
var h24 = 86400000;
// user log
var users = {
	//saif: {balance: -250, open: false, resolved: false, updatedDate: new Date(now - (3 * h24))}
};

var delinquentUsers =[];

var calcDateDiff = function(oldDate, newDate) {
 return (newDate.getDate() - oldDate.getDate());
}

var updateLateFees = function() {
  console.log("in updateLateFees");
  //console.log("delinquentUsers: ", delinquentUsers);
  for(var i = 0;i < delinquentUsers.length; i++) {
    var index = delinquentUsers[i];
    var dateDiff = calcDateDiff(users[index].updatedDate, now);
    if (dateDiff > 0) {
      //console.log(dateDiff);
      users[index].balance -= (5 * dateDiff);
      users[index].updatedDate = now;
    };
  }
}

// Updates the user balance after each transaction
var transactionUpdate= function(user_id, item_type, amount) {
  console.log("In transactionUpdate!");
  if (item_type == "fee") {
      users[user_id]['balance'] -= amount;
  }
  else users[user_id]['balance'] += amount;

  var bal = users[user_id]['balance'];

  console.log("After transaction");
  console.log(users[user_id]);

  return bal;
}

// creates a new card or moves a card from resolved or open cards
var balanceAction = function(user_id, balance, cb) {
  console.log("In balanceAction!");
  if(balance <= -200) {
    // Open Card or Move to Open Card from resolved
    if (users[user_id].resolved) {
      t.put('/1/cards/' + users[user_id].card_id + '/idList', {value: '5564975dcbcbfa7aa6d7f1d0'}, function(err, data) {
        users[user_id].resolved = false;
        users[user_id].open = true;
        cb(err, data);
      });
      delinquentUsers.push(user_id);
      //users[user_id]['updatedDate'] = now;
    }
    else if (!users[user_id].open) {
      createOpenCard(user_id, "5564975dcbcbfa7aa6d7f1d0", null, null, cb);
      delinquentUsers.push(user_id);
      //users[user_id]['updatedDate'] = now;
    }
    
    else {
      cb(undefined, {message: "Card exists in open list"});
    }
  }
  else {
    if (users[user_id].open) {
      console.log("Move card!");
      // Move from open to resolve
      t.put('/1/cards/' + users[user_id].card_id + '/idList', {value: '5564975e7d3fc7c546d04a17'}, function(err, data) {
        users[user_id].open = false;
        users[user_id].resolved = true;
        cb(err, data);
      });
      //users[user_id].updatedDate = now;
      delinquentUsers.splice(delinquentUsers.indexOf(user_id), 1);
    }
    else cb(undefined, {message: "balance is above threshold"});
  }
}

//this calls the post function to create an open card in trello
var createOpenCard = function(name, listID, urlSource, due, cb) {
  console.log("In createOpenCard"); 
  var card = {
    name: name,
    //idList: [listID],
    due: due,
    //urlSource: urlSource
  };

  console.log("What we are sending:");
  console.log(card);
  t.post("/1/lists/5564975dcbcbfa7aa6d7f1d0/cards", card, function(err,data){
    console.log("in API POST");
    console.log(err);
    console.log(data);

    users[name].open = true;
    users[name].card_id = data.id;

    cb(err, data);
  });
};

//creates a new user in the logs
var userUpdate = function(user_id, amount) {
  users[user_id] = {
    balance: (amount >= 0) ? amount : amount * -1,
    open: false,
    resolved: false,
    updatedDate: now
  };
  updateLateFees();
  //users[user_id][''] = (bal <= -200) ? true; 
}

//Sends the post request for the new post request
app.post('/users/:user_id/items', function(req, res) {

  var user = users[req.params.user_id];
  var item_type = req.query.item_type;
  var amount = parseInt(req.query.amount);
	if (user) {
    console.log("User found!");
    updateLateFees();
    var currentBal = transactionUpdate(req.params.user_id, item_type, amount);
    balanceAction(req.params.user_id, currentBal, function(err, data) {
      
      if(err)  res.send(err);
      else {
        res.send(data);
        //console.log(users);
      }
    });

	}
	else {
    userUpdate(req.params.user_id,amount);
    res.send(req.params.user_id + " created");
  }
  //console.log(users);
});


// initializing server 
var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
