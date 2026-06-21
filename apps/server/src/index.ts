
import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { toNodeHandler } from "better-auth/node";
import { auth } from "@code-royale/auth";

const app = express();
const server = http.createServer(app);


app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.all("/api/auth/*splat", toNodeHandler(auth));


app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.emit("welcome", "Connected to server");

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("Socket.IO Server Running");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT ?? 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});