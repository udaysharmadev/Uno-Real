"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const roomManager_1 = require("./rooms/roomManager");
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// Middlewares
app.use((0, cors_1.default)({
    origin: '*', // Allow all origins for testing/development
}));
app.use(express_1.default.json());
// --- REST APIs ---
// Create Room API
app.post('/api/rooms', (req, res) => {
    try {
        const room = roomManager_1.roomManager.createRoom();
        console.log(`[REST] Created room: ${room.code}`);
        res.status(201).json({ code: room.code });
    }
    catch (error) {
        console.error('[REST] Error creating room:', error);
        res.status(500).json({ error: error.message || 'Failed to create room' });
    }
});
// Join Room API (Validation step)
app.post('/api/rooms/join', (req, res) => {
    const { code, name } = req.body;
    if (!code || !name) {
        res.status(400).json({ error: 'Room code and display name are required' });
        return;
    }
    const room = roomManager_1.roomManager.getRoom(code);
    if (!room) {
        res.status(404).json({ error: 'Room not found' });
        return;
    }
    if (room.status === 'playing') {
        res.status(400).json({ error: 'Game has already started in this room' });
        return;
    }
    if (room.players.length >= 6) {
        res.status(400).json({ error: 'Room is full (max 6 players)' });
        return;
    }
    if (!roomManager_1.roomManager.isNameUnique(room, name)) {
        res.status(400).json({ error: 'Display name is already taken in this room' });
        return;
    }
    console.log(`[REST] Validated join request for name "${name}" to room ${code}`);
    res.status(200).json({ success: true });
});
// --- Socket.IO Server Setup ---
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);
    // Track room code on the socket object for easier disconnect handling
    let currentRoomCode = null;
    let currentName = null;
    // Create room event (alternative pathway)
    socket.on('create-room', ({ name }) => {
        try {
            const room = roomManager_1.roomManager.createRoom();
            const { player } = roomManager_1.roomManager.joinRoom(room.code, name, socket.id);
            currentRoomCode = room.code;
            currentName = name;
            socket.join(room.code);
            console.log(`[Socket] Host ${name} (${socket.id}) created and joined room ${room.code}`);
            socket.emit('lobby-updated', room);
            socket.emit('joined-successfully', { room, player });
        }
        catch (error) {
            socket.emit('error', { message: error.message || 'Failed to create room via socket' });
        }
    });
    // Join room socket handler
    socket.on('join-room', ({ code, name }) => {
        try {
            const upperCode = code.toUpperCase();
            const { room, player } = roomManager_1.roomManager.joinRoom(upperCode, name, socket.id);
            currentRoomCode = upperCode;
            currentName = name;
            socket.join(upperCode);
            console.log(`[Socket] Player ${name} (${socket.id}) joined room ${upperCode} at Seat ${player.seatNumber}`);
            // Notify the specific socket they joined successfully
            socket.emit('joined-successfully', { room, player });
            // Notify others in the room
            socket.to(upperCode).emit('player-joined', player);
            // Broadcast the updated lobby state to all players in the room
            io.to(upperCode).emit('lobby-updated', room);
        }
        catch (error) {
            console.error(`[Socket] Join error for client ${socket.id}:`, error.message);
            socket.emit('error', { message: error.message || 'Failed to join room' });
        }
    });
    // Trigger game start (host only)
    socket.on('start-game', () => {
        if (!currentRoomCode)
            return;
        try {
            const room = roomManager_1.roomManager.startGame(currentRoomCode, socket.id);
            console.log(`[Socket] Room ${currentRoomCode} game started by host ${socket.id}`);
            io.to(currentRoomCode).emit('lobby-updated', room);
            io.to(currentRoomCode).emit('game-started', room);
        }
        catch (error) {
            console.error(`[Socket] Start game error for room ${currentRoomCode}:`, error.message);
            socket.emit('error', { message: error.message || 'Failed to start game' });
        }
    });
    // Manual leave-room event
    socket.on('leave-room', () => {
        handleLeave();
    });
    // Disconnect handler
    socket.on('disconnect', () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
        handleLeave();
    });
    // Common cleanup logic for leave/disconnect
    function handleLeave() {
        if (!currentRoomCode)
            return;
        const result = roomManager_1.roomManager.leaveRoom(socket.id);
        if (result) {
            const { room, leftPlayer } = result;
            console.log(`[Socket] Player ${leftPlayer.name} left room ${currentRoomCode}`);
            socket.to(currentRoomCode).emit('player-left', leftPlayer);
            socket.leave(currentRoomCode);
            if (room) {
                // Broadcast the updated lobby to remaining players
                io.to(currentRoomCode).emit('lobby-updated', room);
            }
        }
        currentRoomCode = null;
        currentName = null;
    }
});
// Start Server
server.listen(port, () => {
    console.log(`===============================================`);
    console.log(`  UNO Real Backend Server running on port ${port}  `);
    console.log(`===============================================`);
});
