import { Server, Socket } from "socket.io";
import { prisma } from "@code-royale/db";
import {
  ServerToClientEvents,
  ClientToServerEvents,
  RoomCreatedPayload,
  RoomJoinedPayload,
  PlayerJoinedPayload,
  MatchFoundPayload,
} from "@code-royale/shared-types";
import { nanoid } from "nanoid";

type AppServer = Server<ClientToServerEvents, ServerToClientEvents>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

// tracks which matchId a socket is currently in
const socketRoomMap = new Map<string, string>();

export function registerRoomHandlers(io: AppServer, socket: AppSocket) {

  // ── Create room ──────────────────────────
  socket.on("create_room", async ({ categories, questionCount, durationSec }) => {
    try {
      const roomCode = nanoid(6).toUpperCase();

      const match = await prisma.match.create({
        data: {
          mode: "FRIEND_ROOM",
          status: "WAITING",
          roomCode,
          hostId: socket.data.user.id,
          categories,
          questionCount,
          durationSec,
          players: {
            create: { userId: socket.data.user.id },
          },
        },
      });

      await socket.join(match.id);
      socketRoomMap.set(socket.id, match.id);

      socket.emit("room_created", {
        matchId: match.id,
        roomCode,
        hostId: socket.data.user.id,
      });

      console.log(`Room ${roomCode} created by ${socket.data.user.name}`);
    } catch (err) {
      console.error(err);
      socket.emit("room_error", "Failed to create room");
    }
  });

  // ── Join room ─────────────────────────────
  socket.on("join_room", async ({ roomCode }) => {
    try {
      const match = await prisma.match.findUnique({
        where: { roomCode },
        include: {
          players: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
      });

      if (!match) {
        socket.emit("room_error", "Room not found");
        return;
      }

      if (match.status !== "WAITING") {
        socket.emit("room_error", "Match already started");
        return;
      }

      if (match.players.length >= 6) {
        socket.emit("room_error", "Room is full");
        return;
      }

      const alreadyIn = match.players.some(
        (p) => p.userId === socket.data.user.id
      );

      if (!alreadyIn) {
        await prisma.matchPlayer.create({
          data: { matchId: match.id, userId: socket.data.user.id },
        });
      }

      await socket.join(match.id);
      socketRoomMap.set(socket.id, match.id);

      const allPlayers = [
        ...match.players.map((p) => ({ id: p.user.id, name: p.user.name })),
        ...(!alreadyIn ? [{ id: socket.data.user.id, name: socket.data.user.name }] : []),
      ];

      // tell the joining player the full room state
      socket.emit("room_joined", {
        matchId: match.id,
        roomCode: match.roomCode!,
        players: allPlayers,
        categories: match.categories,
        questionCount: match.questionCount,
        durationSec: match.durationSec,
      });

      // tell everyone else someone joined
      if (!alreadyIn) {
        socket.to(match.id).emit("player_joined", {
          player: { id: socket.data.user.id, name: socket.data.user.name },
          totalPlayers: allPlayers.length,
        });
      }

      console.log(`${socket.data.user.name} joined room ${roomCode}`);
    } catch (err) {
      console.error(err);
      socket.emit("room_error", "Failed to join room");
    }
  });

  // ── Start match (host only) ───────────────
  socket.on("start_match", async () => {
    try {
      const matchId = socketRoomMap.get(socket.id);
      if (!matchId) {
        socket.emit("room_error", "You are not in a room");
        return;
      }

      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          players: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
      });

      if (!match) { socket.emit("room_error", "Room not found"); return; }
      if (match.hostId !== socket.data.user.id) { socket.emit("room_error", "Only the host can start"); return; }
      if (match.players.length < 2) { socket.emit("room_error", "Need at least 2 players"); return; }

      io.to(matchId).emit("match_starting", {
        matchId: match.id,
        roomCode: match.roomCode!,
        players: match.players.map((p) => ({ id: p.user.id, name: p.user.name })),
        categories: match.categories,
        questionCount: match.questionCount,
        durationSec: match.durationSec,
      });

      console.log(`Match starting: ${matchId}`);
    } catch (err) {
      console.error(err);
      socket.emit("room_error", "Failed to start match");
    }
  });

  // ── Leave / disconnect cleanup ────────────
  socket.on("leave_room", () => handleLeaveRoom(socket, io));
  socket.on("disconnect", () => handleLeaveRoom(socket, io));
}

async function handleLeaveRoom(socket: AppSocket, io: AppServer) {
  const matchId = socketRoomMap.get(socket.id);
  if (!matchId) return;

  socketRoomMap.delete(socket.id);
  socket.leave(matchId);

  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { players: true },
    });

    if (!match || match.status !== "WAITING") return;

    await prisma.matchPlayer.deleteMany({
      where: { matchId, userId: socket.data.user.id },
    });

    const remaining = match.players.filter(
      (p) => p.userId !== socket.data.user.id
    );

    // no players left — delete the match
    if (remaining.length === 0) {
      await prisma.match.delete({ where: { id: matchId } });
      console.log(`Room ${matchId} deleted — empty`);
      return;
    }

    // host left — reassign to first remaining player
    if (match.hostId === socket.data.user.id) {
      await prisma.match.update({
        where: { id: matchId },
        data: { hostId: remaining[0]?.userId },
      });
      console.log(`New host: ${remaining[0]?.userId}`);
    }

    console.log(`${socket.data.user.name} left room ${matchId}`);
  } catch (err) {
    console.error("Leave room error:", err);
  }
}