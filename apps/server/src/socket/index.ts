import { Server } from "socket.io";
import {Server as HttpServer} from "http"
import { socketAuthMiddleware } from "./middleware";
import { registerQueueHandlers } from "./handlers/queue.handler";
import { registerRoomHandlers } from "./handlers/room.handler";
export function createSocketServer(httpServer:HttpServer){
  const io=new Server(httpServer,{
    cors:{
      origin:"http://localhost:3000",
      credentials:true
    }
  })

  io.use(socketAuthMiddleware)

  io.on("connection",(socket)=>{
    console.log(`User connected: ${socket.data.user.name} (${socket.id})`);
  
        registerQueueHandlers(io, socket);
    registerRoomHandlers(io, socket);
    socket.on("disconnect", (reason) => {
      console.log(`User disconnected: ${socket.data.user.name} — ${reason}`);
    });
  
  
  })
}