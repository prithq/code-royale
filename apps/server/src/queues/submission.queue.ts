import {Queue,Worker,Job} from "bullmq"
import { prisma } from "@code-royale/db"
import { runAllTestCases } from "../services/judge0.service"
import { io } from "../index"
import { endMatch } from "../socket/handlers/match.handler"
const connection = {
  host: "localhost",
  port: 6379,
};


export const submissionQueue=new Queue("submissions",{connection})


type SubmissionJob = {
  matchId: string;
  problemId: string;
  userId: string;
  playerName: string;
  code: string;
  language: string;
  socketId: string;
};



const worker=new Worker<SubmissionJob>("submissions",async(job:Job<SubmissionJob>)=>{

const { matchId, problemId, userId, playerName, code, language, socketId } =
  job.data;


  const matchProblem=await prisma.matchProblem.findFirst({
    where:{matchId,problemId},
    include:{
      problem:{
        include:{
          testCases:true
        }
      }
    }

  })


   if (!matchProblem) return;


     const { passed, runtimeMs } = await runAllTestCases(
      code,
       matchProblem.problem.harness,
      language,
      matchProblem.problem.testCases.map((tc) => ({
        input: tc.input,
        expected: tc.expected,
      })),
     
    );


    await prisma.submission.create({
      data:{
        matchId,
        problemId,
        userId,
        code,
        language,
        passed,
        runtimeMs
      }
    })

if (passed) {
      // update score
      await prisma.matchPlayer.updateMany({
        where: { matchId, userId },
        data: { score: { increment: 100 } },
      });

      // broadcast problem_solved to the room
      io.to(matchId).emit("problem_solved", {
        userId,
        playerName,
        problemId,
        problemTitle: matchProblem.problem.title,
        solvedAt: new Date().toISOString(),
      });

      // check if all players solved all problems
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: { players: true, problems: true },
      });

      if (match) {
        const allSubmissions = await prisma.submission.findMany({
          where: { matchId, passed: true },
        });

        const totalProblems = match.problems.length;
        const allSolved = match.players.every((p) => {
          const solved = allSubmissions.filter(
            (s) => s.userId === p.userId
          ).length;
          return solved >= totalProblems;
        });

        if (allSolved) {
         
          await endMatch(io, matchId, "all_solved");
        }
      }
    } else {
      // tell the player their submission failed
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit("submission_failed", {
          problemId,
          message: "Some test cases failed — try again",
        });
      }
    }
  },
  { connection }
);

worker.on("failed", (job, err) => {
  console.error(`Submission job ${job?.id} failed:`, err);
});

console.log("Submission worker started");













