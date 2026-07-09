
import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { toNodeHandler } from "better-auth/node";
import { auth } from "@code-royale/auth";
import { createSocketServer } from "./socket";
import routes from "./routes/index";
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
app.use("/api", routes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const io=createSocketServer(server)

const PORT = process.env.PORT ?? 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export {io}