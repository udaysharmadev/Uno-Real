const { io } = require("socket.io-client");

const socket1 = io("http://localhost:3001");
const socket2 = io("http://localhost:3001");

let roomCode = "";

socket1.on("connect", () => {
  console.log("Player 1 connected");
  socket1.emit("create-room", { name: "Player 1" });
});

socket1.on("joined-successfully", ({ room }) => {
  console.log("Player 1 joined room:", room.code);
  roomCode = room.code;
  
  socket2.emit("join-room", { code: roomCode, name: "Player 2" });
});

socket2.on("joined-successfully", () => {
  console.log("Player 2 joined room. Starting game...");
  socket1.emit("start-game");
});

socket1.on("game-updated", (payload) => {
  console.log("\n[Player 1] Game Updated Payload received:");
  console.log("Discard Pile length:", payload.discardPile?.length);
  if (payload.discardPile?.length > 0) {
    console.log("Top card:", payload.discardPile[payload.discardPile.length - 1]);
  } else {
    console.log("Discard pile is empty or undefined!");
  }
  
  // Exit after printing
  setTimeout(() => process.exit(0), 1000);
});
