import { Server,Socket } from "socket.io";
import {prisma} from "@code-royale/db"

import { ServerToClientEvents,ClientToServerEvents,MatchFoundPayload } from "@code-royale/shared-types";

type AppServer = Server<ClientToServerEvents, ServerToClientEvents>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>;


type QueuedPlayer = {
  socketId: string;
  userId: string;
  name: string;
  rating: number;
};

const queue: QueuedPlayer[] = [];
const MATCH_SIZE = 2;

const DEFAULT_CATEGORIES = ["arrays","strings","dp","graphs","trees","linked-list"];
const DEFAULT_QUESTION_COUNT = 3;
const DEFAULT_DURATION_SEC = 900;

export function removeFromQueue(socketId:string){

const index=queue.findIndex((p)=>p.socketId===socketId)
if(index!==-1){
    queue.splice(index,1)
    console.log(`Removed ${socketId} from queue`);
    
}



}


async function tryMatch(io:AppServer){



    if(queue.length<MATCH_SIZE)
        return

    const players=queue.splice(0,MATCH_SIZE)
    console.log(`Matching ${players.map((p)=>p.name).join("vs")}`);

    try{
        const match=await prisma.match.create({
            data:{
                mode:"QUICKPLAY",
                status:"WAITING",
                categories:DEFAULT_CATEGORIES,
                questionCount: DEFAULT_QUESTION_COUNT,
                durationSec: DEFAULT_DURATION_SEC,
                players:{
                    create:players.map((p)=>({
                        userId:p.userId,
                        ratingBefore:p.rating
                    }))
                }
                

            }
        })


        const payload:MatchFoundPayload={
             matchId: match.id,
            roomCode: match.id,
            players: players.map((p) => ({ id: p.userId, name: p.name })),
            categories: DEFAULT_CATEGORIES,
            questionCount: DEFAULT_QUESTION_COUNT,
            durationSec: DEFAULT_DURATION_SEC,
        }

        for(const player of players){
            const socket=io.sockets.sockets.get(player.socketId)
            if(socket){
                await socket.join(match.id)
                socket.emit("match_found",payload)
            }
        }

        console.log(`Match created: ${match.id}`);

    }catch(err){

            console.error("Failed to create match:", err);
            // put players back if match creation failed
            queue.unshift(...players);
    }


   







    }
    
export function registerQueueHandlers(io:AppServer,socket:AppSocket){
    socket.on("join_queue",async ()=>{
        
     const alreadyQueued = queue.find((p) => p.socketId === socket.id);

      if (alreadyQueued) {
      socket.emit("queue_error", "You are already in the queue");
      return;
    }

    const user = await prisma.user.findUnique({
      where:{ id: socket.data.user.id },
      select:{ id: true, name: true, rating: true },
    });

    if(!user) {
      socket.emit("queue_error","User not found");
      return;
    }

    queue.push({
      socketId: socket.id,
      userId: user.id,
      name: user.name,
      rating: user.rating,
    });

    socket.emit("queue_joined",{
        position:queue.length,
        message:`You are #${queue.length} in the queue`
    })

    console.log(`${user.name} joined queue. Queue size: ${queue.length}`);
    
    await tryMatch(io);

    })


    socket.on("leave_queue",()=>{
        removeFromQueue(socket.id)
        console.log(`${socket.data.user.name} left queue`);
    })

    socket.on("disconnect", () => {
    removeFromQueue(socket.id);
  });



}