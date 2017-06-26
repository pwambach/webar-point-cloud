const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const http = require('http');
const ip = require('ip').address();
const port = 8000;
const WebSocket = require('ws');
const pointDataPath = path.resolve(__dirname, '../data/points2.csv');

const server = http.createServer(app);
const wss = new WebSocket.Server({server});
const connections = [];

app.use(cors());
app.use(bodyParser.json({limit: '1GB'})); // should be enough :)
// serve static files
app.use(express.static('public'));
app.use(express.static('data'));

// point data upload
app.post('/points', function(req, res) {
  const data = req.body;
  const result = [];

  for (let i = 0; i < data.length; i = i + 3) {
    const line = [data[i], data[i + 1], data[i + 2]];
    result.push(line.join(';'));
  }

  const content = result.join('\n');
  const bytes = Math.round(content.length / 1024);

  fs.appendFile(pointDataPath, content, 'utf8', () => {
    console.log(`Data saved: ${result.length} points (${bytes} KB)`);
    res.send('ok');
  });
});

wss.on('connection', function connection(ws) {
  console.log('New connection');
  connections.push(ws);

  ws.on('message', function incoming(message) {
     console.log('position received', message);
     propagatePosition(ws, JSON.parse(message));
  });

  ws.on('close', function close(closedWs) {
    const index = connections.indexOf(closedWs);
    connections.splice(index, 1);
  });

  ws.send('welcome');
});

function propagatePosition(sender, position) {
  const receivers = connections.filter(connection => connection !== sender);

  console.log(receivers.length);
  const message = {
    type: 'position',
    data: position
  };
  receivers.forEach(receiver => receiver.send(JSON.stringify(message)));
}

server.listen(port, ip, function() {
  const url = `http://${ip}:${port}`;
  console.log(`Listening on ${url}`);
  console.log('---');
  console.log(`Point data will be appended to: ${pointDataPath}`);
  console.log(`Tanggo Url: ${url}`);
  console.log(`Desktop Url: ${url}/show.html`);
  console.log(`Data endpoint: POST ${url}/points`);
  console.log(`Websocket Url: ws://${ip}:${port}`);
});
