import { Router } from "express";
import { prisma } from "@code-royale/db";

const router:Router = Router();

// GET /api/match/:matchId/results
router.get("/:matchId/results", async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        players: {
          orderBy: { finalRank: "asc" },
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        problems: {
          orderBy: { order: "asc" },
          include: {
            problem: { select: { id: true, title: true, difficulty: true } },
          },
        },
      },
    });

    if (!match) {
      res.status(404).json({ message: "Match not found" });
      return;
    }

    if (match.status !== "FINISHED") {
      res.status(400).json({ message: "Match is not finished yet" });
      return;
    }

    const leaderboard = await Promise.all(
      match.players.map(async (p) => {
        const solved = await prisma.submission.count({
          where: { matchId, userId: p.userId, passed: true },
        });

        return {
          rank: p.finalRank,
          userId: p.userId,
          playerName: p.user.name,
          score: p.score,
          solvedCount: solved,
        };
      })
    );

    res.json({
      matchId: match.id,
      mode: match.mode,
      startedAt: match.startedAt,
      endedAt: match.endedAt,
      problems: match.problems.map((mp) => ({
        id: mp.problem.id,
        title: mp.problem.title,
        difficulty: mp.problem.difficulty,
      })),
      leaderboard,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// GET /api/match/:matchId/submissions
router.get("/:matchId/submissions", async (req, res) => {
  try {
    const { matchId } = req.params;

    const submissions = await prisma.submission.findMany({
      where: { 
        matchId 
    },
      orderBy: { 
        createdAt: "asc" },
      include: {
        user: { select: { id: true, name: true } },
        problem: { select: { id: true, title: true } },
      },
    });

    res.json(
      submissions.map((s) => ({
        id: s.id,
        player: s.user.name,
        problem: s.problem.title,
        language: s.language,
        passed: s.passed,
        runtimeMs: s.runtimeMs,
        submittedAt: s.createdAt,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
});

export default router;