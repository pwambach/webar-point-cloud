const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors());

// respond with "hello world" when a GET request is made to the homepage
app.get('/', function(req, res) {
  console.log('hello world');
  res.send('hello world');
});

app.post('/data', function(req, res) {
  console.log('data received');
  res.send('data received');
});

app.listen(8000, function() {
  console.log('listening on port 8000!');
});
