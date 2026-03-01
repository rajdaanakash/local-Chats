const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// RAM storage - cleared when Render goes to sleep
let logHistory = [];

io.on('connection', (socket) => {
    socket.on('join', (username) => {
        socket.username = username;
        const welcome = { user: 'SYSTEM', text: `${username} established connection.` };
        logHistory.push(welcome);
        io.emit('message', welcome);
    });

    socket.on('chatMessage', (msg) => {
        const entry = { user: socket.username, text: msg };
        logHistory.push(entry);
        io.emit('message', entry);
    });
});

// Use Render's assigned port, or default to 3000 for your Lenovo LOQ
const PORT = process.env.PORT || 3000;

http.listen(PORT, '0.0.0.0', () => {
    console.log(`Mission Log active on port ${PORT}`);
});