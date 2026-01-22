// server.ts (Deno)
// - Serves ./index.html (and any other static files in the same folder)
// - WebSocket multiplayer (snapshot-based relay)
// - Rooms capped at 4 players
// - No authoritative simulation: clients send snapshots; server rebroadcasts to others
//
// Run:
//   deno run --allow-net --allow-read server.ts
//
// Then open:
//   http://localhost:8080/

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { serveFile } from "https://deno.land/std@0.224.0/http/file_server.ts";

type PeerId = string;
type RoomId = string;

const PORT = Number(Deno.env.get("PORT") ?? 8080);
const MAX_ROOM_SIZE = 4;
const DEFAULT_GAME_ID = "default";

// Basic safety limits (tune as desired)
const MAX_MESSAGE_BYTES = 64 * 1024; // 64KB
const MAX_SNAPSHOTS_PER_SEC = 30;

type ClientInfo = {
  peerId: PeerId;
  roomId: RoomId;
  gameId: string;
  ws: WebSocket;
  lastTickWindowStartMs: number;
  snapshotsThisWindow: number;
  name?: string;
  joinedAtMs: number;
};

const rooms = new Map<string, Map<RoomId, Map<PeerId, ClientInfo>>>();

function makePeerId(): PeerId {
  // Simple random id; enough for friends
  return crypto.randomUUID().replaceAll("-", "").slice(0, 16);
}

function safeSend(ws: WebSocket, obj: unknown) {
  if (ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(obj));
}

function broadcastRoom(gameId: string, roomId: RoomId, msg: unknown, exceptPeerId?: PeerId) {
  const gameRooms = rooms.get(gameId);
  const room = gameRooms?.get(roomId);
  if (!room) return;
  for (const [pid, client] of room.entries()) {
    if (exceptPeerId && pid === exceptPeerId) continue;
    safeSend(client.ws, msg);
  }
}

function removeClient(gameId: string, roomId: RoomId, peerId: PeerId) {
  const gameRooms = rooms.get(gameId);
  const room = gameRooms?.get(roomId);
  if (!room) return;

  const existed = room.delete(peerId);
  if (existed) {
    broadcastRoom(gameId, roomId, { type: "peer-left", peerId });
  }

  if (room.size === 0) gameRooms?.delete(roomId);
  if (gameRooms && gameRooms.size === 0) rooms.delete(gameId);
}

function isProbablyJsonText(data: unknown): data is string {
  return typeof data === "string";
}

function withinSnapshotRateLimit(client: ClientInfo): boolean {
  const now = Date.now();
  if (now - client.lastTickWindowStartMs >= 1000) {
    client.lastTickWindowStartMs = now;
    client.snapshotsThisWindow = 0;
  }
  client.snapshotsThisWindow += 1;
  return client.snapshotsThisWindow <= MAX_SNAPSHOTS_PER_SEC;
}

function isValidRoomId(roomId: unknown): roomId is string {
  if (typeof roomId !== "string") return false;
  const r = roomId.trim();
  // Allow simple room ids you can put in URL hashes or query params
  return r.length >= 1 && r.length <= 64 && /^[a-zA-Z0-9_\-]+$/.test(r);
}

function isValidGameId(gameId: unknown): gameId is string {
  if (typeof gameId !== "string") return false;
  const g = gameId.trim();
  return g.length >= 1 && g.length <= 64 && /^[a-zA-Z0-9_\-]+$/.test(g);
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // ---- WebSocket endpoint ----
  if (url.pathname === "/ws") {
    if (req.headers.get("upgrade")?.toLowerCase() !== "websocket") {
      return new Response("Expected WebSocket", { status: 400 });
    }

    const { socket, response } = Deno.upgradeWebSocket(req);

    // We only know peerId/room after the client sends {type:"join"}
    let joined = false;
    let joinedAtMs: number = 0;
    let roomId: RoomId | null = null;
    let peerId: PeerId | null = null;
    let gameId: string = DEFAULT_GAME_ID;

    socket.onopen = () => {
      // no-op; wait for join
    };

    socket.onclose = () => {
      if (joined && roomId && peerId) removeClient(gameId, roomId, peerId);
    };

    socket.onerror = () => {
      if (joined && roomId && peerId) removeClient(gameId, roomId, peerId);
    };

    socket.onmessage = (ev) => {
      // Size cap (best-effort: string length is chars, but enough here)
      if (typeof ev.data === "string" && ev.data.length > MAX_MESSAGE_BYTES) {
        try {
          socket.close(1009, "Message too big");
        } catch {
          // ignore
        }
        return;
      }

      if (!isProbablyJsonText(ev.data)) return;

      let msg: any;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      if (!msg || typeof msg.type !== "string") return;

      // ---- Join ----
      if (msg.type === "join") {
        if (joined) return; // ignore repeat joins

        if (!isValidRoomId(msg.roomId)) {
          safeSend(socket, { type: "error", code: "bad_room", message: "Invalid roomId" });
          return;
        }

        if (msg.gameId !== undefined && !isValidGameId(msg.gameId)) {
          safeSend(socket, { type: "error", code: "bad_game", message: "Invalid gameId" });
          return;
        }

        gameId = isValidGameId(msg.gameId) ? msg.gameId.trim() : DEFAULT_GAME_ID;
        const rid = msg.roomId.trim() as RoomId;
        let gameRooms = rooms.get(gameId);
        if (!gameRooms) {
          gameRooms = new Map();
          rooms.set(gameId, gameRooms);
        }
        let room = gameRooms.get(rid);
        if (!room) {
          room = new Map();
          gameRooms.set(rid, room);
        }

        if (room.size >= MAX_ROOM_SIZE) {
          safeSend(socket, { type: "error", code: "room_full", message: "Room is full" });
          return;
        }

        roomId = rid;
        peerId = makePeerId();
        joined = true;
        joinedAtMs = Date.now();

        const clientInfo: ClientInfo = {
          peerId,
          roomId,
          gameId,
          joinedAtMs,
          ws: socket,
          lastTickWindowStartMs: Date.now(),
          snapshotsThisWindow: 0,
          name: typeof msg.name === "string" ? msg.name.trim().slice(0, 24) : undefined
        };

        room.set(peerId, clientInfo);

        const peers = [...room.keys()].filter((id) => id !== peerId);
        const names = Object.fromEntries(
          [...room.values()]
            .filter((client) => client.peerId !== peerId)
            .map((client) => [client.peerId, client.name ?? ""]),
        );
        const peerMeta = Object.fromEntries(
          [...room.values()]
            .filter((client) => client.peerId !== peerId)
            .map((client) => [client.peerId, { joinedAtMs: client.joinedAtMs }]),
        );

        // Tell the joiner who they are + who else is present
        safeSend(socket, {
          type: "welcome",
          peerId,
          roomId,
          peers,
          names,
          peerMeta,
          joinedAtMs,
        });
        if (typeof msg.name === "string" && msg.name.trim().length > 0) {
          broadcastRoom(gameId, roomId, { type: "peer-name", peerId, name: msg.name.trim().slice(0, 24) }, peerId);
          const clientRecord = room.get(peerId);
          if (clientRecord) clientRecord.name = msg.name.trim().slice(0, 24);
        }

        // Tell the room about the new peer
        broadcastRoom(
          gameId,
          roomId,
          { type: "peer-joined", peerId, name: clientInfo.name ?? "", joinedAtMs },
          peerId,
        );

        return;
      }

      // Must have joined for everything else
      if (!joined || !roomId || !peerId) {
        safeSend(socket, { type: "error", code: "not_joined", message: "Join a room first" });
        return;
      }

      // Fetch current client record
      const gameRooms = rooms.get(gameId);
      const room = gameRooms?.get(roomId);
      const client = room?.get(peerId);
      if (!room || !client) return;

      // ---- WebRTC signaling relay (optional; keep if you also do proximity voice) ----
      if (msg.type === "webrtc-offer" || msg.type === "webrtc-answer" || msg.type === "webrtc-ice") {
        const toPeerId = typeof msg.toPeerId === "string" ? msg.toPeerId : "";
        const toClient = room.get(toPeerId);
        if (!toClient) return;

        safeSend(toClient.ws, {
          type: msg.type,
          fromPeerId: peerId,
          sdp: msg.sdp ?? null,
          candidate: msg.candidate ?? null,
        });
        return;
      }

      // ---- Snapshot-based game sync ----
      // Client sends:
      //   { type:"snapshot", seq, t, state:{...} }
      // Server broadcasts to others:
      //   { type:"snapshot", fromPeerId, seq, t, state }
      //
      // No desync handling here; clients should interpolate remote snapshots.
      if (msg.type === "snapshot") {
        if (!withinSnapshotRateLimit(client)) return;

        // Very light validation (keeps it flexible)
        const seq = typeof msg.seq === "number" ? msg.seq : undefined;
        const t = typeof msg.t === "number" ? msg.t : undefined;
        const state = msg.state; // arbitrary JSON object

        broadcastRoom(gameId, roomId, { type: "snapshot", fromPeerId: peerId, seq, t, state }, peerId);
        return;
      }

      // Optional: chat/pings/etc. (room broadcast)
      if (msg.type === "name" && typeof msg.name === "string") {
        const name = msg.name.trim().slice(0, 24);
        client.name = name.length > 0 ? name : undefined;
        broadcastRoom(gameId, roomId, { type: "peer-name", peerId, name }, peerId);
        return;
      }

      if (msg.type === "event" && typeof msg.event === "string") {
        const payload = msg.payload ?? null;
        broadcastRoom(gameId, roomId, { type: "event", fromPeerId: peerId, event: msg.event, payload }, peerId);
        return;
      }

      if (msg.type === "chat" && typeof msg.text === "string") {
        broadcastRoom(gameId, roomId, { type: "chat", fromPeerId: peerId, text: msg.text.slice(0, 500) }, peerId);
        return;
      }

      // Unknown message types ignored
    };

    return response;
  }

  // ---- Static file serving ----
  if (url.pathname === "/rooms") {
    const gameId = isValidGameId(url.searchParams.get("gameId"))
      ? url.searchParams.get("gameId")!.trim()
      : DEFAULT_GAME_ID;
    const gameRooms = rooms.get(gameId) ?? new Map();
    const payload = [...gameRooms.entries()].map(([roomId, room]) => ({
      roomId,
      players: room.size,
    }));
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  // Serve index.html at /
  if (url.pathname === "/") {
    return serveFile(req, "./site/index.html");
  }

  // Serve other local files (textures, scripts, etc.) by path
  // WARNING: this allows reading any file under the current working directory.
  // For a friend project this is usually fine; for public hosting, lock this down.
  if (url.pathname.startsWith("/")) {
    const filePath = `./site${decodeURIComponent(url.pathname)}`;
    try {
      return await serveFile(req, filePath);
    } catch {
      return new Response("Not found", { status: 404 });
    }
  }

  return new Response("Not found", { status: 404 });
}

console.log(`Server running on http://localhost:${PORT}`);
console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);

serve(handler, { port: PORT });
