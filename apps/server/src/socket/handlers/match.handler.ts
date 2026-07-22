import { prisma } from "@code-royale/db";
import { selectProblems, computeLeaderboard } from "../../services/match.service";
import { runAllTestCases } from "../../services/judge0.service";
import { isRateLimited } from "../../middleware/socketRateLimiter";
import { submissionQueue } from "../../queues/submission.queue";
const activeTimers:Record<string,NodeJS.Timeout>={}
const solvedCount:Record<string,number>={}

export async function startMatch(io:any,payload:any){
    const {matchId,categories,questionCount,durationSec,players}=payload

    try{

        const problems=await selectProblems(categories,questionCount)

       await prisma.matchProblem.createMany({
        data: problems.map((p, index) => ({
        matchId,
        problemId: p.id,
        order: index + 1,
      })),
       });

       await prisma.match.update({
        where:{id:matchId},
        data:{status:"ACTIVE",startedAt: new Date()}
       })

       io.to(matchId).emit("match_started",{
        matchId,
        problems,
        durationSec,
        startedAt:new Date().toISOString()
       })

       console.log(`Match ${matchId} started — ${problems.length} problems`);

       let secondsLeft = durationSec;

       const timer=setInterval(async ()=>{
        secondsLeft--

        if(secondsLeft%10===0 || secondsLeft<=10)
            io.to(matchId).emit("timer_tick",secondsLeft)

        if(secondsLeft<=0){
            clearInterval(timer)
            delete activeTimers[matchId]
            await endMatch(io,matchId,"timer")
        }


       },1000)
       activeTimers[matchId]=timer





    }catch(err){
        console.error("match error: ",err)
    }



}

export async function endMatch(io: any, matchId: string, reason: string) {
  if (activeTimers[matchId]) {
    clearInterval(activeTimers[matchId]);
    delete activeTimers[matchId];
  }


  Object.keys(solvedCount)
    .filter((k) => k.startsWith(matchId))
    .forEach((k) => delete solvedCount[k]);


      try {
        await prisma.match.update({
      where: { id: matchId },
      data: { status: "FINISHED", endedAt: new Date() },
    });

    const leaderboard = await computeLeaderboard(matchId);

    for (const entry of leaderboard) {
      await prisma.matchPlayer.updateMany({
        where: { matchId, userId: entry.userId },
        data: { finalRank: entry.rank },
      });
    }

    io.to(matchId).emit("match_ended",{
        matchId,
        reason,
        leaderboard
    })

    console.log(`Match ${matchId} ended ${reason}`)

}catch(err){
    console.error("end match",err)
}
}


export function registerMatchHandlers(io: any, socket: any) {
  socket.on(
    "submit_code",
    async ({ matchId, problemId, code, language }: any) => {
      try {

        if (isRateLimited(socket.id, "submit_code", 10, 60 * 1000)) {
    socket.emit("submission_failed", {
      problemId,
      message: "Too many submissions — wait a moment",
    });
    return;
  }
        const match = await prisma.match.findUnique({
          where: { id: matchId },
          include: { players: true },
        });

        if (!match || match.status !== "ACTIVE") return;

        const isPlayer = match.players.some(
          (p) => p.userId === socket.data.user.id
        );
        if (!isPlayer) return;


        const alreadySolved = await prisma.submission.findFirst({
          where: {
            matchId,
            problemId,
            userId: socket.data.user.id,
            passed: true,
          },
        });
        if (alreadySolved) return;


        await submissionQueue.add("submissions",{
          matchId,
          problemId,
          userId:socket.data.user.id,
          playerName:socket.data.user.name,
          code,
          language,
          socketId:socket.id
        })

         socket.emit("submission_queued", {
          problemId,
          message: "Code submitted — judging in progress",
        });


        console.log(
          `Submission queued: ${socket.data.user.name}=> problem ${problemId}`
        );


      } catch (err) {
        console.error("submit_code error:", err);
      }
    }
  );
}
