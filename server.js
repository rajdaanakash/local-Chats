const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Serve the frontend file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// RAM storage - This will automatically wipe when Render goes to sleep (after 15 min inactivity)
let logHistory = [];

io.on('connection', (socket) => {
    
    // Handle user joining
    socket.on('join', (username) => {
        const cleanUsername = username || "ANONYMOUS_USER";
        socket.username = cleanUsername;
        
        const welcome = { user: 'SYSTEM', text: `${cleanUsername} established connection.` };
        logHistory.push(welcome);
        
        // Send history to the new user so they see previous messages in this session
        socket.emit('load history', logHistory);
        
        // Notify others
        socket.broadcast.emit('message', welcome);
    });

    // Handle chat messages
    socket.on('chatMessage', (msg) => {
        const sender = socket.username || "ANONYMOUS_USER"; 
        const entry = { user: sender, text: msg };
        
        logHistory.push(entry);
        io.emit('message', entry); // Send to everyone
    });
});

// Port binding for Render (process.env.PORT) or Local (3000)
const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
    console.log(`Mission Log active on port ${PORT}`);
});