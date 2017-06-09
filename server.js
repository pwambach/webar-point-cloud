const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');

app.use(cors());
app.use(
  bodyParser.raw({type: 'application/octet-stream', limit: 10000 * 3 * 4})
);

// respond with "hello world" when a GET request is made to the homepage
app.get('/', function(req, res) {
  console.log('hello world');
  res.send('hello world');
});

app.post('/data', function(req, res) {
  console.log('data received', req.body);
  res.send('data received');
});

app.listen(8000, function() {
  console.log('listening on port 8000!');
});
