import { prisma } from "@code-royale/db";
import { selectProblems, computeLeaderboard } from "../../services/match.service";
import { runAllTestCases } from "../../services/judge0.service";
import { arch } from "os";
import { log } from "console";

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
            io.to(matchId).emit("timer",secondsLeft)

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
        const match = await prisma.match.findUnique({
          where: { id: matchId },
          include: { players: true, problems: true },
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

        const matchProblem = await prisma.matchProblem.findFirst({
          where: { matchId, problemId },
          include: {
            problem: {
              include: { testCases: true },
            },
          },
        });
        if (!matchProblem) return;

        const { passed, runtimeMs } = await runAllTestCases(
          code,
          language,
          matchProblem.problem.harness, 
          matchProblem.problem.testCases.map((tc) => ({
            input: tc.input,
            expected: tc.expected,
          }))
        );

        await prisma.submission.create({
          data: {
            matchId,
            problemId,
            userId: socket.data.user.id,
            code,
            language,
            passed,
            runtimeMs,
          },
        });

        if (passed) {
          await prisma.matchPlayer.updateMany({
            where: { matchId, userId: socket.data.user.id },
            data: { score: { increment: 100 } },
          });

          const key = `${matchId}_${socket.data.user.id}`;
          solvedCount[key] = (solvedCount[key] ?? 0) + 1;

          io.to(matchId).emit("problem_solved", {
            userId: socket.data.user.id,
            playerName: socket.data.user.name,
            problemId,
            problemTitle: matchProblem.problem.title,
            solvedAt: new Date().toISOString(),
          });

          const totalProblems = match.problems.length;
          const allSolved = match.players.every((p) => {
            const k = `${matchId}_${p.userId}`;
            return (solvedCount[k] ?? 0) >= totalProblems;
          });

          if (allSolved) {
            await endMatch(io, matchId, "all_solved");
          }
        } else {
          socket.emit("submission_failed", {
            problemId,
            message: "Some test cases failed — try again",
          });
        }
      } catch (err) {
        console.error("submit_code error:", err);
      }
    }
  );
}
