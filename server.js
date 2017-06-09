const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');

app.use(cors());
app.use(bodyParser.json({limit: '10MB'}));

// respond with "hello world" when a GET request is made to the homepage
app.get('/', function(req, res) {
  console.log('ok');
  res.send('ok');
});

app.post('/data', function(req, res) {
  const data = req.body;
  const result = [];

  for (let i = 0; i < data.length; i = i + 3) {
    const line = [data[i], data[i + 1], data[i + 2]];
    result.push(line.join(';'));
  }

  fs.appendFile('points.csv', result.join('\n'), 'utf8', () => {
    console.log('data received: ', result.length, ' points');
    res.send('ok');
  });
});

app.listen(8000, function() {
  console.log('listening on port 8000!');
});
