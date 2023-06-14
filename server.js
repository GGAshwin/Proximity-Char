const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const User = require('./model')

const { sin, cos, sqrt, atan2 } = Math;
const proximityThreshold = 2

function radians(degrees) {
  return degrees * Math.PI / 180;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  // Convert coordinates to radians
  const lat1Rad = radians(lat1);
  const lon1Rad = radians(lon1);
  const lat2Rad = radians(lat2);
  const lon2Rad = radians(lon2);

  // Radius of the Earth in kilometers
  const radius = 6371;

  // Haversine formula
  const dlat = lat2Rad - lat1Rad;
  const dlon = lon2Rad - lon1Rad;
  const a = sin(dlat / 2) ** 2 + cos(lat1Rad) * cos(lat2Rad) * sin(dlon / 2) ** 2;
  const c = 2 * atan2(sqrt(a), sqrt(1 - a));
  const distance = radius * c;

  return distance;
}

const lat1 = 12.872725;
const lon1 = 74.8366696;
const lat2 = 12.8881078;
const lon2 = 74.840655;

const distance = calculateDistance(lat1, lon1, lat2, lon2);
console.log(`The distance between the two locations is ${distance.toFixed(2)} kilometers.`);


const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
const connectionParams = {
  useNewUrlParser: true,
  useUnifiedTopology: true
}
mongoose.connect('mongodb://127.0.0.1:27017/proximity?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.6.0', connectionParams)
  .then(() => {
    console.log('Connected to the database ')
  })
  .catch((err) => {
    console.error(`Error connecting to the database. n${err}`);
  })


app.use(express.static((__dirname)))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// io.on('connection', (socket) => {
//     console.log("User connected");
//     socket.broadcast.emit('hi')

//     socket.on('chat message', (msg) => {
//       console.log('message: ' + msg);
//       socket.broadcast.emit(msg)
//     });
//     socket.on('disconnect',()=>{
//         console.log("User disconnected");
//     })
//   });

io.on('connection', (socket) => {
  socket.on('location', async (location) => {
    console.log(location);
    const longitude = location.longitude;
    const latitude = location.latitude;
    const username = location.user
    try {
      const user = await User.create({
        username,
        latitude,
        longitude
      })
      socket.username = username
      socket.latitude = latitude
      socket.longitude = longitude
    } catch (error) {
      const deletUser = await User.findOneAndDelete({ username: username })
      const user = await User.create({
        username,
        latitude,
        longitude
      })
    }
    finally {
      // calculateDistance(latitude, longitude)
      socket.join("room#1")
    }
  })

  socket.on('new user', (user) => {
    console.log('new user: ' + user)
    io.emit('new user', user);
  })

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
    console.log(msg);
  });
  socket.on('disconnect', () => {

  })
});

server.listen(3000 || process.env.PORT, () => {
  console.log('listening on *:3000');
});