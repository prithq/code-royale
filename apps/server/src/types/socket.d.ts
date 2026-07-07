import { User } from "@code-royale/db";

declare module "socket.io"{
    interface SocketData{
        user:{
            id:string
            name:string
            email:string
        }
    }
}