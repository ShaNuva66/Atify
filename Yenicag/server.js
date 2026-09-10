import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, stat } from "node:fs/promises";
import { promisify } from "node:util";
import { brotliCompress, gzip, constants as zlibConstants } from "node:zlib";
import { WebSocketServer, WebSocket } from "ws";

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");
const rooms = new Map();
const fighterIds = new Set(["fox", "raccoon", "rabbit", "owl", "bear", "cat"]);
const arenaIds = new Set(["sunset", "mushroom", "aurora"]);
const weaponIds = new Set(["findik", "roket", "ucleyen", "buz", "meteor", "plazma", "seri", "seken", "bomba", "yapiskan", "mayin", "hava", "matkap", "itici", "zehir", "isinla"]);
const initialAmmo = () => ({ findik: -1, roket: 4, ucleyen: 3, buz: 3, meteor: 2, plazma: 3, seri: 3, seken: 3, bomba: 4, yapiskan: 2, mayin: 2, hava: 2, matkap: 2, itici: 3, zehir: 2, isinla: 2 });
const raceWeapons = ["findik", "roket", "buz", "bomba", "seken", "itici", "zehir", "meteor"];
const chaosModifiers = ["lowGravity", "superWind", "megaBlast", "bouncy", "noGuides"];
const arenaWind = { sunset: 18, mushroom: 24, aurora: 12 };
const staticCache = new Map();
const brotliAsync = promisify(brotliCompress);
const gzipAsync = promisify(gzip);
const compressibleExtensions = new Set([".html", ".js", ".css", ".json", ".svg"]);
const MAX_BUFFERED_BYTES = 512 * 1024;
const ROOM_IDLE_MS = 30 * 60 * 1000;

function sanitizeRules(value = {}) {
  const turnSeconds = [15, 25, 40].includes(Number(value.turnSeconds)) ? Number(value.turnSeconds) : 25;
  const startingHp = [75, 100, 150].includes(Number(value.startingHp)) ? Number(value.startingHp) : 100;
  const wind = ["low", "normal", "high"].includes(value.wind) ? value.wind : "normal";
  const crates = ["scarce", "normal", "abundant"].includes(value.crates) ? value.crates : "normal";
  const suddenDeathTurn = [0, 8, 12, 16].includes(Number(value.suddenDeathTurn)) ? Number(value.suddenDeathTurn) : 12;
  const gameType = ["classic", "control", "weaponRace", "chaos"].includes(value.gameType) ? value.gameType : "classic";
  return { turnSeconds, startingHp, wind, crates, suddenDeathTurn, gameType };
}

function clearTurnTimer(room) { if (room.turnTimer) { clearTimeout(room.turnTimer); room.turnTimer = null; } }
function openTurn(room) {
  clearTurnTimer(room);
  room.shotOpen = true;
  room.turnEndsAt = Date.now() + room.rules.turnSeconds * 1000;
  room.turnTimer = setTimeout(() => expireTurn(room), room.rules.turnSeconds * 1000 + 20);
}
function expireTurn(room) {
  if (rooms.get(room.code) !== room || !room.started || !room.shotOpen) return;
  const expiredPlayer = room.turn;
  awardControlPoint(room);
  const gameOver = matchResult(room);
  if (gameOver) {
    clearTurnTimer(room); room.shotOpen = false; room.turnEndsAt = null;
    broadcast(room, "turn_timeout", { expiredPlayer, turn: room.turn, moveBudget: room.moveBudget, wind: room.wind, turnEndsAt: null, turnNumber: room.turnNumber, dangerInset: room.dangerInset, objective: room.objective, weaponProgress: room.weaponProgress, chaosModifier: room.chaosModifier, gameOver });
    return;
  }
  advanceTurn(room);
  broadcast(room, "turn_timeout", { expiredPlayer, turn: room.turn, moveBudget: room.moveBudget, wind: room.wind, turnEndsAt: room.turnEndsAt, turnNumber: room.turnNumber, dangerInset: room.dangerInset, objective: room.objective, weaponProgress: room.weaponProgress, chaosModifier: room.chaosModifier });
}
function rollWind(room) {
  let scale = room.rules.wind === "low" ? .55 : room.rules.wind === "high" ? 1.7 : 1;
  if (room.chaosModifier === "superWind") scale *= 2.1;
  return Math.round((Math.random() * 2 - 1) * arenaWind[room.arena] * scale);
}
function advanceTurn(room) {
  for (let step = 1; step <= room.players.length; step += 1) {
    const candidate = (room.turn + step) % room.players.length;
    if ((room.hp[candidate] ?? 100) > 0 && !room.players[candidate].disconnected) { room.turn = candidate; break; }
  }
  room.turnNumber += 1;
  if (room.rules.suddenDeathTurn > 0 && room.turnNumber > room.rules.suddenDeathTurn) room.dangerInset = Math.min(430, room.dangerInset + 28);
  if (room.rules.gameType === "chaos") room.chaosModifier = chaosModifiers[(room.seed + room.turnNumber) % chaosModifiers.length];
  room.wind = rollWind(room);
  room.moveBudget[room.turn] = 160;
  openTurn(room);
}

function surfaceCost(arena, x) {
  if (arena === "sunset" && x >= 315 && x <= 455) return 1.7;
  if (arena === "mushroom" && x >= 515 && x <= 695) return 1.45;
  if (arena === "aurora" && x >= 335 && x <= 520) return .65;
  return 1;
}

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp"
};

function cleanName(value) {
  return String(value || "Oyuncu").trim().slice(0, 18).replace(/[<>]/g, "") || "Oyuncu";
}

function cleanCode(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
}

function cleanFighter(value) { return fighterIds.has(value) ? value : "fox"; }
function cleanArena(value) { return arenaIds.has(value) ? value : "sunset"; }

function roomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 100; attempt += 1) {
    let code = "";
    for (let i = 0; i < 5; i += 1) code += alphabet[Math.floor(Math.random() * alphabet.length)];
    if (!rooms.has(code)) return code;
  }
  throw new Error("Oda kodu olusturulamadi");
}

function send(ws, type, payload = {}) {
  if (ws.readyState !== WebSocket.OPEN) return false;
  if (ws.bufferedAmount > MAX_BUFFERED_BYTES) { ws.close(1013, "Baglanti cok yavas"); return false; }
  ws.send(JSON.stringify({ type, ...payload }));
  return true;
}

function broadcast(room, type, payload = {}) {
  room.players.forEach((player) => send(player.ws, type, payload));
}

function publicPlayers(room) {
  return room.players.map(({ name, fighter, disconnected }, index) => ({ name, fighter, team: room.mode === "team2v2" ? index % 2 : null, disconnected: Boolean(disconnected), index }));
}

function roomLayout(size) { return size === 4 ? [155, 455, 825, 1125] : [205, 1075]; }

function startPayload(room, playerIndex) {
  return { code: room.code, seed: room.seed, turn: room.turn, arena: room.arena, roomMode: room.mode, friendlyFire: room.friendlyFire, rules: room.rules, maxPlayers: room.maxPlayers, positions: room.positions, moveBudget: room.moveBudget, ammo: room.ammo, wind: room.wind, turnEndsAt: room.turnEndsAt, turnNumber: room.turnNumber, dangerInset: room.dangerInset, authorityIndex: room.authorityIndex, objective: room.objective, weaponProgress: room.weaponProgress, raceWeapons, chaosModifier: room.chaosModifier, playerIndex, players: publicPlayers(room) };
}

function matchResult(room) {
  const alive = room.hp.map((hp, index) => hp > 0 && !room.players[index].disconnected ? index : -1).filter((index) => index >= 0);
  if (room.rules.gameType === "control") { const winner = room.objective.scores.findIndex((score) => score >= room.objective.target); if (winner >= 0) return room.mode === "team2v2" ? { winningTeam: winner, reason: "control" } : { winner, reason: "control" }; }
  if (room.rules.gameType === "weaponRace") { const winner = room.weaponProgress.findIndex((progress) => progress >= raceWeapons.length); if (winner >= 0) return room.mode === "team2v2" ? { winningTeam: winner % 2, winner, reason: "weaponRace" } : { winner, reason: "weaponRace" }; }
  if (room.mode === "team2v2") { const teams = [...new Set(alive.map((index) => index % 2))]; return teams.length <= 1 ? { winningTeam: teams[0] ?? null } : null; }
  return alive.length <= 1 ? { winner: alive[0] ?? null } : null;
}

function awardControlPoint(room) {
  if (room.rules.gameType !== "control" || room.hp[room.turn] <= 0) return;
  if (Math.abs(room.positions[room.turn] - room.objective.x) > room.objective.radius) return;
  const scoreIndex = room.mode === "team2v2" ? room.turn % 2 : room.turn;
  room.objective.scores[scoreIndex] += 1;
}

function leaveRoom(ws) {
  const code = ws.roomCode;
  if (!code || !rooms.has(code)) return;
  const room = rooms.get(code);
  const leavingIndex = room.players.findIndex((player) => player.ws === ws);
  const leaving = room.players[leavingIndex];
  ws.roomCode = null;
  if (!room.started) {
    room.players.splice(leavingIndex, 1);
    if (!room.players.length) { clearTurnTimer(room); rooms.delete(code); } else { room.players.forEach((player, index) => { player.ws.roomCode = code; send(player.ws, "room_waiting", { count: room.players.length, maxPlayers: room.maxPlayers, playerIndex: index }); }); }
    return;
  }
  if (leavingIndex >= 0) { leaving.disconnected = true; room.hp[leavingIndex] = 0; }
  if (room.players.every((player) => player.disconnected || player.ws.readyState !== WebSocket.OPEN)) { clearTurnTimer(room); rooms.delete(code); return; }
  room.authorityIndex = room.players.findIndex((player) => !player.disconnected && player.ws.readyState === WebSocket.OPEN);
  const result = matchResult(room);
  if (result) { clearTurnTimer(room); room.shotOpen = false; room.turnEndsAt = null; broadcast(room, "match_abandoned", { ...result, name: leaving?.name || "Rakip" }); }
  else { if (room.turn === leavingIndex) advanceTurn(room); broadcast(room, "player_left", { playerIndex: leavingIndex, name: leaving?.name || "Rakip", turn: room.turn, authorityIndex: room.authorityIndex, turnEndsAt: room.turnEndsAt }); }
}

function validShot(shot) {
  return shot && Number.isFinite(shot.angle) && shot.angle >= 5 && shot.angle <= 85 &&
    Number.isFinite(shot.power) && shot.power >= 15 && shot.power <= 100 &&
    weaponIds.has(shot.weapon);
}

const server = http.createServer(async (req, res) => {
  try {
    if (!['GET', 'HEAD'].includes(req.method || 'GET')) { res.writeHead(405, { Allow: "GET, HEAD" }); return res.end(); }
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (url.pathname === "/Yenicag") { res.writeHead(308, { Location: "/Yenicag/" }); return res.end(); }
    const mountedPath = url.pathname.startsWith("/Yenicag/") ? url.pathname.slice("/Yenicag".length) : url.pathname;
    const requested = mountedPath === "/" ? "/index.html" : decodeURIComponent(mountedPath);
    const filePath = path.resolve(ROOT, `.${requested}`);
    if (!filePath.startsWith(ROOT + path.sep)) throw new Error("Gecersiz yol");
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("Dosya degil");
    const extension = path.extname(filePath);
    let cached = staticCache.get(filePath);
    if (!cached || cached.mtimeMs !== info.mtimeMs) {
      cached = { mtimeMs: info.mtimeMs, body: await readFile(filePath), br: null, gzip: null };
      staticCache.set(filePath, cached);
    }
    const asset = requested.startsWith("/assets/");
    const cacheControl = asset ? "public, max-age=31536000, immutable" : extension === ".html" ? "no-cache" : "public, max-age=300, must-revalidate";
    const etag = `W/\"${info.size}-${Math.floor(info.mtimeMs)}\"`;
    const headers = { "Content-Type": contentTypes[extension] || "application/octet-stream", "Cache-Control": cacheControl, ETag: etag, "X-Content-Type-Options": "nosniff" };
    if (req.headers["if-none-match"] === etag) { res.writeHead(304, headers); return res.end(); }
    let body = cached.body;
    if (compressibleExtensions.has(extension) && body.length > 1024) {
      headers.Vary = "Accept-Encoding";
      const accepted = String(req.headers["accept-encoding"] || "");
      if (accepted.includes("br")) {
        cached.br ||= await brotliAsync(cached.body, { params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 4 } });
        body = cached.br; headers["Content-Encoding"] = "br";
      } else if (accepted.includes("gzip")) {
        cached.gzip ||= await gzipAsync(cached.body, { level: 6 });
        body = cached.gzip; headers["Content-Encoding"] = "gzip";
      }
    }
    headers["Content-Length"] = body.length;
    res.writeHead(200, headers);
    res.end(req.method === "HEAD" ? undefined : body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Bulunamadi");
  }
});

const wss = new WebSocketServer({ server, maxPayload: 16 * 1024 });

wss.on("connection", (ws) => {
  ws.isAlive = true;
  ws.messageWindowAt = Date.now();
  ws.messageCount = 0;
  ws.on("pong", () => { ws.isAlive = true; });

  ws.on("message", (raw) => {
    const messageNow = Date.now();
    if (messageNow - ws.messageWindowAt >= 1000) { ws.messageWindowAt = messageNow; ws.messageCount = 0; }
    ws.messageCount += 1;
    if (ws.messageCount > 180) { ws.close(1008, "Cok fazla mesaj"); return; }
    if (ws.messageCount > 90) return;
    let message;
    try { message = JSON.parse(raw.toString()); } catch { return send(ws, "error", { message: "Gecersiz mesaj." }); }

    if (message.type === "create_room") {
      leaveRoom(ws);
      const code = roomCode();
      const mode = ["ffa4", "team2v2"].includes(message.onlineMode) ? message.onlineMode : "duel";
      const maxPlayers = mode === "duel" ? 2 : 4;
      const rules = sanitizeRules(message.rules); const seed = Math.floor(Math.random() * 1_000_000);
      const scoreSlots = mode === "team2v2" ? 2 : maxPlayers;
      const room = { code, mode, rules, friendlyFire: mode === "team2v2" && message.friendlyFire === true, maxPlayers, started: false, authorityIndex: 0, seed, turn: 0, turnNumber: 1, dangerInset: 0, shotOpen: false, turnEndsAt: null, lastActivity: Date.now(), arena: cleanArena(message.arena), positions: roomLayout(maxPlayers), moveBudget: Array(maxPlayers).fill(160), ammo: Array.from({ length: maxPlayers }, () => rules.gameType === "weaponRace" ? Object.fromEntries([...weaponIds].map((id) => [id, -1])) : initialAmmo()), hp: Array(maxPlayers).fill(rules.startingHp), objective: { x: 500 + seed % 281, radius: 92, target: 3, scores: Array(scoreSlots).fill(0) }, weaponProgress: Array(maxPlayers).fill(0), chaosModifier: rules.gameType === "chaos" ? chaosModifiers[seed % chaosModifiers.length] : null, players: [] };
      room.wind = rollWind(room);
      room.players.push({ ws, name: cleanName(message.name), fighter: cleanFighter(message.fighter) });
      rooms.set(code, room);
      ws.roomCode = code;
      return send(ws, "room_created", { code, playerIndex: 0, players: publicPlayers(room), roomMode: mode, friendlyFire: room.friendlyFire, rules, maxPlayers });
    }

    if (message.type === "join_room") {
      leaveRoom(ws);
      const code = cleanCode(message.code);
      const room = rooms.get(code);
      if (!room) return send(ws, "error", { message: "Oda bulunamadi." });
      if (room.started || room.players.length >= room.maxPlayers) return send(ws, "error", { message: "Oda dolu." });
      room.players.push({ ws, name: cleanName(message.name), fighter: cleanFighter(message.fighter) });
      room.lastActivity = Date.now();
      ws.roomCode = code;
      if (room.players.length < room.maxPlayers) { broadcast(room, "room_waiting", { count: room.players.length, maxPlayers: room.maxPlayers }); return; }
      room.started = true; openTurn(room);
      room.players.forEach((player, index) => send(player.ws, "match_start", startPayload(room, index)));
      return;
    }

    const room = rooms.get(ws.roomCode);
    if (!room) return send(ws, "error", { message: "Once bir odaya katil." });
    room.lastActivity = Date.now();
    const playerIndex = room.players.findIndex((player) => player.ws === ws);

    if (message.type === "jump") {
      if (playerIndex !== room.turn || !room.shotOpen || room.moveBudget[playerIndex] < 28) return;
      room.moveBudget[playerIndex] -= 28;
      broadcast(room, "jump", { playerIndex, budget: room.moveBudget[playerIndex] });
      return;
    }

    if (message.type === "move") {
      if (playerIndex !== room.turn || !room.shotOpen || ![-1, 1].includes(message.direction)) return;
      const cost = surfaceCost(room.arena, room.positions[playerIndex]);
      const requestedDistance = Number.isFinite(Number(message.distance)) ? Math.max(1, Math.min(10, Number(message.distance))) : 6;
      const step = Math.min(requestedDistance, room.moveBudget[playerIndex] / cost);
      if (step <= 0) return;
      const candidate = Math.max(70, Math.min(1210, room.positions[playerIndex] + message.direction * step));
      if (room.positions.some((x, index) => index !== playerIndex && room.hp[index] > 0 && Math.abs(candidate - x) < 110)) return;
      const spent = Math.abs(candidate - room.positions[playerIndex]) * cost;
      room.positions[playerIndex] = candidate;
      room.moveBudget[playerIndex] = Math.max(0, room.moveBudget[playerIndex] - spent);
      broadcast(room, "move", { playerIndex, x: candidate, budget: room.moveBudget[playerIndex] });
      return;
    }

    if (message.type === "shoot") {
      if (playerIndex !== room.turn || !room.shotOpen || !validShot(message.shot)) return;
      if (room.rules.gameType === "weaponRace" && message.shot.weapon !== raceWeapons[room.weaponProgress[playerIndex]]) return;
      const remaining = room.ammo[playerIndex][message.shot.weapon];
      if (remaining === 0) return;
      if (remaining > 0) room.ammo[playerIndex][message.shot.weapon] -= 1;
      clearTurnTimer(room);
      room.shotOpen = false;
      room.turnEndsAt = null;
      broadcast(room, "shoot", { playerIndex, shot: message.shot, ammo: room.ammo });
      return;
    }

    if (message.type === "state_sync" && playerIndex === room.authorityIndex && !room.shotOpen) {
      const previousHp = room.hp.slice();
      const respawned = new Set();
      if (Array.isArray(message.players) && message.players.length === room.players.length) {
        const synced = message.players.map((player, index) => Number.isFinite(Number(player.x)) ? Math.max(70, Math.min(1210, Number(player.x))) : room.positions[index]);
        room.positions = synced;
        room.hp = message.players.map((player, index) => Number.isFinite(Number(player.hp)) ? Math.max(0, Math.min(room.rules.startingHp, Number(player.hp))) : room.hp[index]);
      }
      if (room.rules.gameType === "weaponRace") {
        const scored = room.hp.some((hp, index) => index !== room.turn && (room.mode !== "team2v2" || index % 2 !== room.turn % 2) && hp < previousHp[index]);
        if (scored) room.weaponProgress[room.turn] = Math.min(raceWeapons.length, room.weaponProgress[room.turn] + 1);
        const spawnPositions = roomLayout(room.maxPlayers);
        room.hp.forEach((hp, index) => {
          if (hp > 0 || room.players[index].disconnected) return;
          room.hp[index] = room.rules.startingHp;
          room.positions[index] = spawnPositions[index];
          respawned.add(index);
        });
      }
      awardControlPoint(room);
      const gameOver = matchResult(room);
      if (!gameOver) {
        advanceTurn(room);
        if (message.turnModifiers?.freeze) room.moveBudget[room.turn] = Math.max(60, room.moveBudget[room.turn] - 55);
        if (message.turnModifiers?.stun) room.turnEndsAt = Date.now() + Math.max(8_000, (room.rules.turnSeconds - 10) * 1000);
      } else { clearTurnTimer(room); room.shotOpen = false; room.turnEndsAt = null; }
      broadcast(room, "state_sync", {
        players: message.players?.map((player, index) => ({ ...player, hp: room.hp[index], x: room.positions[index], shield: respawned.has(index) ? 0 : player.shield, effects: respawned.has(index) ? {} : player.effects })),
        craters: message.craters,
        barrels: message.barrels,
        platforms: message.platforms,
        wind: room.wind,
        turn: room.turn,
        arena: room.arena,
        moveBudget: room.moveBudget,
        ammo: room.ammo,
        turnEndsAt: room.turnEndsAt,
        turnNumber: room.turnNumber,
        dangerInset: room.dangerInset,
        objective: room.objective,
        weaponProgress: room.weaponProgress,
        raceWeapons,
        chaosModifier: room.chaosModifier,
        gameOver
      });
      return;
    }

    if (message.type === "rematch" && playerIndex === room.authorityIndex) {
      room.seed = Math.floor(Math.random() * 1_000_000);
      room.turn = Math.floor(Math.random() * room.maxPlayers);
      room.shotOpen = true;
      room.positions = roomLayout(room.maxPlayers);
      room.moveBudget = Array(room.maxPlayers).fill(160);
      room.turnNumber = 1;
      room.dangerInset = 0;
      room.ammo = Array.from({ length: room.maxPlayers }, () => room.rules.gameType === "weaponRace" ? Object.fromEntries([...weaponIds].map((id) => [id, -1])) : initialAmmo());
      room.hp = Array(room.maxPlayers).fill(room.rules.startingHp);
      room.objective.scores.fill(0);
      room.objective.x = 500 + room.seed % 281;
      room.weaponProgress.fill(0);
      room.chaosModifier = room.rules.gameType === "chaos" ? chaosModifiers[room.seed % chaosModifiers.length] : null;
      room.wind = rollWind(room);
      room.players.forEach((player) => { player.disconnected = false; });
      openTurn(room);
      room.players.forEach((player, index) => send(player.ws, "match_start", startPayload(room, index)));
    }
  });

  ws.on("close", () => leaveRoom(ws));
  ws.on("error", () => leaveRoom(ws));
});

const heartbeat = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30_000);

const roomJanitor = setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.lastActivity <= ROOM_IDLE_MS) continue;
    broadcast(room, "room_expired", { message: "Oda uzun süre kullanılmadığı için kapatıldı." });
    room.players.forEach((player) => { player.ws.roomCode = null; });
    clearTurnTimer(room);
    rooms.delete(code);
  }
}, 60_000);

server.on("close", () => { clearInterval(heartbeat); clearInterval(roomJanitor); rooms.forEach(clearTurnTimer); });
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(PORT, HOST, () => console.log(`Pati Savaslari: http://localhost:${PORT}`));
}

export { server, rooms, cleanCode, cleanName, validShot, surfaceCost, sanitizeRules, matchResult };
