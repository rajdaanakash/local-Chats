const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const mongoose = require('mongoose');

// 1. MongoDB Connection (Using Environment Variable for Render)
const mongoURI = process.env.MONGODB_URI;
if (mongoURI) {
    mongoose.connect(mongoURI)
        .then(() => console.log("Connected to MongoDB Atlas"))
        .catch(err => console.error("MongoDB Connection Error:", err));
}

// 2. Access Log Schema (Only stores usernames)
const accessSchema = new mongoose.Schema({
    username: String,
    loginTime: { type: Date, default: Date.now }
});
const AccessLog = mongoose.model('AccessLog', accessSchema);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

let logHistory = []; // Clears when Render sleeps

io.on('connection', (socket) => {
    // --- EVERYTHING USING 'SOCKET' MUST BE INSIDE THESE BRACKETS ---

    socket.on('join', async (username) => {
        // Fix for 'undefined' username
        const cleanUsername = username || "ANONYMOUS_USER";
        socket.username = cleanUsername;

        // PERMANENT: Save login to MongoDB if URI exists
        if (mongoURI) {
            try {
                const newRecord = new AccessLog({ username: cleanUsername });
                await newRecord.save();
            } catch (err) {
                console.error("DB Save Error:", err);
            }
        }

        const welcome = { user: 'SYSTEM', text: `${cleanUsername} established connection.` };
        logHistory.push(welcome);
        io.emit('message', welcome);
    });

    socket.on('chatMessage', (msg) => {
        const sender = socket.username || "ANONYMOUS_USER"; 
        const entry = { user: sender, text: msg };
        
        logHistory.push(entry);
        io.emit('message', entry);
    });
});

// 3. Port Binding for Render
const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
    console.log(`Mission Log active on port ${PORT}`);
});