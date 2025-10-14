console.log("Hello VALORANT!");

// Data to send to the client side
let agents = {
  "data": [
    { "name": "Jett",    "gender": "Female", "nationality": "South Korea", "role": "Duelist" },
    { "name": "Phoenix", "gender": "Male",   "nationality": "United Kingdom", "role": "Duelist" },
    { "name": "Sage",    "gender": "Female", "nationality": "China", "role": "Sentinel" },
    { "name": "Sova",    "gender": "Male",   "nationality": "Russia", "role": "Initiator" },
    { "name": "Reyna",   "gender": "Female", "nationality": "Mexico", "role": "Duelist" },
    { "name": "Brimstone","gender": "Male",  "nationality": "United States", "role": "Controller" },
    { "name": "Omen",    "gender": "Male",   "nationality": "Unknown", "role": "Controller" },
    { "name": "Killjoy", "gender": "Female", "nationality": "Germany", "role": "Sentinel" },
    { "name": "Raze",    "gender": "Female", "nationality": "Brazil", "role": "Duelist" },
    { "name": "Fade",    "gender": "Female", "nationality": "Turkey", "role": "Initiator" }
  ]
};

// 3. Require express
let express = require('express');

// 4. Call express function
let app = express();

// 11. Serve static files
app.use(express.static('public'));

// 8. about route
app.get('/about', function (request, response) {
  response.send("This is a VALORANT agents demo");
});

// 9. Create a data route
app.get('/agents', function (request, response) {
  response.json(agents);
});

// 10. Serve specific data
app.get('/agents/:name', function (request, response) {
  let q = (request.params.name || '').toLowerCase().trim();
  let found = agents.data.find(a => a.name.toLowerCase() === q);
  if (found) {
    response.json(found);
  } else {
    response.json({ "status": "No such agent" });
  }
});

// 6. Listen to run the server
app.listen(5500, function () {
  console.log("The app is listening on http://localhost:5500");
});