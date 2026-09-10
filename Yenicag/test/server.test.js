import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { WebSocket } from "ws";
import { server, cleanCode, cleanName, validShot, surfaceCost, sanitizeRules, matchResult } from "../server.js";

let baseUrl;
let httpUrl;

before(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `ws://127.0.0.1:${server.address().port}/Yenicag/`;
  httpUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

function openClient() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(baseUrl);
    ws.once("open", () => resolve(ws));
    ws.once("error", reject);
  });
}

test('online jump cannot be repeated in air; both clients receive the same airborne firing pose', async () => {
  const host=await openClient(),guest=await openClient();
  try {
    const created=nextMessage(host,'room_created');
    host.send(JSON.stringify({type:'create_room',name:'Retro',arena:'sunset'}));
    const room=await created;
    const starts=[nextMessage(host,'match_start'),nextMessage(guest,'match_start')];
    guest.send(JSON.stringify({type:'join_room',code:room.code,name:'Rakip'}));await Promise.all(starts);
    const jumped=nextMessage(host,'jump');host.send(JSON.stringify({type:'jump'}));
    const jump=await jumped;assert.equal(jump.pose.airborne,true);assert.equal(jump.budget,132);
    host.send(JSON.stringify({type:'jump'}));
    const moved=nextMessage(host,'move');host.send(JSON.stringify({type:'move',direction:1}));
    assert.equal((await moved).budget,126);
    const shots=[nextMessage(host,'shoot'),nextMessage(guest,'shoot')];
    host.send(JSON.stringify({type:'shoot',shot:{angle:60,power:65,weapon:'roket',facing:-1}}));
    const [a,b]=await Promise.all(shots);assert.deepEqual(a.poses,b.poses);assert.equal(a.poses[0].airborne,true);assert.equal(a.poses[0].facing,-1);assert.ok(a.poses[0].vy<0);
  } finally {host.close();guest.close();}
});

function nextMessage(ws, expectedType) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`${expectedType} mesaji zaman asimina ugradi`)), 2000);
    const handler = (raw) => {
      const message = JSON.parse(raw.toString());
      if (message.type !== expectedType) return;
      clearTimeout(timeout);
      ws.off("message", handler);
      resolve(message);
    };
    ws.on("message", handler);
  });
}

test("kullanici girdileri guvenli bicimde temizlenir", () => {
  assert.equal(cleanCode(" ab-12!z "), "AB12Z");
  assert.equal(cleanName("<b>Pati</b>"), "bPati/b");
  assert.equal(validShot({ angle: 45, power: 70, weapon: "roket" }), true);
  assert.equal(validShot({ angle: 52, power: 61, weapon: "meteor" }), true);
  assert.equal(validShot({ angle: 37, power: 74, weapon: "zehir" }), true);
  assert.equal(validShot({ angle: 95, power: 70, weapon: "roket" }), false);
  assert.equal(surfaceCost("sunset", 350), 1.7);
  assert.equal(surfaceCost("mushroom", 600), 1.45);
  assert.equal(surfaceCost("aurora", 400), .65);
  assert.deepEqual(sanitizeRules({ turnSeconds: 15, startingHp: 150, wind: "high", crates: "abundant", suddenDeathTurn: 8, gameType: "chaos" }), { turnSeconds: 15, startingHp: 150, wind: "high", crates: "abundant", suddenDeathTurn: 8, gameType: "chaos" });
  assert.deepEqual(sanitizeRules({ turnSeconds: 999, startingHp: -5, gameType: "hile" }), { turnSeconds: 25, startingHp: 100, wind: "normal", crates: "normal", suddenDeathTurn: 12, gameType: "classic" });
});

test("kontrol ve silah yarisi zafer kosullari sunucuda belirlenir", () => {
  const players = [{}, {}, {}, {}];
  const controlRoom = {
    players,
    hp: [100, 100, 100, 100],
    mode: "team2v2",
    rules: { gameType: "control" },
    objective: { scores: [2, 3], target: 3 },
    weaponProgress: [0, 0, 0, 0]
  };
  assert.deepEqual(matchResult(controlRoom), { winningTeam: 1, reason: "control" });

  const raceRoom = {
    ...controlRoom,
    mode: "ffa4",
    rules: { gameType: "weaponRace" },
    objective: { scores: [0, 0, 0, 0], target: 3 },
    weaponProgress: [3, 8, 5, 0]
  };
  assert.deepEqual(matchResult(raceRoom), { winner: 1, reason: "weaponRace" });

  const classicRoom = { ...raceRoom, rules: { gameType: "classic" }, hp: [0, 0, 42, 0] };
  assert.deepEqual(matchResult(classicRoom), { winner: 2 });
});

test("web istemcisi HTTP uzerinden sunulur", async () => {
  const response = await fetch(httpUrl);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Yeniçağ — Retro Taktik Arena/);
  const mounted = await fetch(`${httpUrl}/Yenicag/`);
  assert.equal(mounted.status, 200);
  assert.match(await mounted.text(), /Yeniçağ — Retro Taktik Arena/);
});

test("statik dosyalar sikistirilir ve uzun sure onbelleklenir", async () => {
  const script = await fetch(`${httpUrl}/game.js`, { headers: { "accept-encoding": "br" } });
  assert.equal(script.status, 200);
  assert.equal(script.headers.get("content-encoding"), "br");
  assert.match(script.headers.get("cache-control"), /must-revalidate/);
  const etag = script.headers.get("etag");
  assert.ok(etag);
  const unchanged = await fetch(`${httpUrl}/game.js`, { headers: { "if-none-match": etag } });
  assert.equal(unchanged.status, 304);

  const asset = await fetch(`${httpUrl}/assets/tactical-ammo-atlas-v2.webp`);
  assert.equal(asset.status, 200);
  assert.equal(asset.headers.get("content-type"), "image/webp");
  assert.match(asset.headers.get("cache-control"), /immutable/);
});

test("iki oyuncu oda kurar, katilir ve atis senkronize edilir", async () => {
  const host = await openClient();
  const guest = await openClient();
  host.send(JSON.stringify({ type: "create_room", name: "Pati", fighter: "rabbit", arena: "aurora", rules: { turnSeconds: 15, startingHp: 150, wind: "high", crates: "abundant", suddenDeathTurn: 8 } }));
  const created = await nextMessage(host, "room_created");
  assert.match(created.code, /^[A-Z0-9]{5}$/);

  const hostStart = nextMessage(host, "match_start");
  const guestStart = nextMessage(guest, "match_start");
  guest.send(JSON.stringify({ type: "join_room", code: created.code, name: "Tilki", fighter: "cat" }));
  const [hostMatch, guestMatch] = await Promise.all([hostStart, guestStart]);
  assert.equal(hostMatch.playerIndex, 0);
  assert.equal(guestMatch.playerIndex, 1);
  assert.equal(hostMatch.arena, "aurora");
  assert.equal(hostMatch.players[0].fighter, "rabbit");
  assert.equal(hostMatch.players[1].fighter, "cat");
  assert.equal(hostMatch.players.length, 2);
  assert.equal(hostMatch.ammo[0].meteor, 2);
  assert.ok(hostMatch.turnEndsAt > Date.now());
  assert.equal(hostMatch.turnNumber, 1);
  assert.equal(hostMatch.dangerInset, 0);
  assert.equal(hostMatch.rules.turnSeconds, 15);
  assert.equal(hostMatch.rules.startingHp, 150);
  assert.equal(hostMatch.rules.crates, "abundant");
  assert.equal(Number.isFinite(hostMatch.wind), true);

  const hostMove = nextMessage(host, "move");
  const guestMove = nextMessage(guest, "move");
  host.send(JSON.stringify({ type: "move", direction: 1 }));
  const [movedHost, movedGuest] = await Promise.all([hostMove, guestMove]);
  assert.equal(movedHost.x, 211);
  assert.equal(movedGuest.budget, 154);

  const hostJump = nextMessage(host, "jump");
  const guestJump = nextMessage(guest, "jump");
  host.send(JSON.stringify({ type: "jump" }));
  const [jumpedHost, jumpedGuest] = await Promise.all([hostJump, guestJump]);
  assert.equal(jumpedHost.playerIndex, 0);
  assert.equal(jumpedGuest.budget, 126);

  const hostShot = nextMessage(host, "shoot");
  const guestShot = nextMessage(guest, "shoot");
  host.send(JSON.stringify({ type: "shoot", shot: { angle: 44, power: 65, weapon: "roket" } }));
  const [hostAction, guestAction] = await Promise.all([hostShot, guestShot]);
  assert.equal(hostAction.playerIndex, 0);
  assert.deepEqual(hostAction.shot, guestAction.shot);
  assert.equal(hostAction.ammo[0].roket, 3);

  const hostSync = nextMessage(host, "state_sync");
  const guestSync = nextMessage(guest, "state_sync");
  host.send(JSON.stringify({ type: "state_sync", players: [{ hp: 100 }, { hp: 80 }], craters: [], wind: 4, gameOver: null }));
  const [, synced] = await Promise.all([hostSync, guestSync]);
  assert.equal(synced.turn, 1);
  assert.equal(synced.players[1].hp, 80);

  const hostRematch = nextMessage(host, "match_start");
  const guestRematch = nextMessage(guest, "match_start");
  host.send(JSON.stringify({ type: "rematch" }));
  const [hostRestart, guestRestart] = await Promise.all([hostRematch, guestRematch]);
  assert.equal(hostRestart.playerIndex, 0);
  assert.equal(guestRestart.playerIndex, 1);
  host.close(); guest.close();
});

test("dort oyunculu herkes tek odasi dolar ve elenen oyuncunun turu atlanir", async () => {
  const clients = await Promise.all([openClient(), openClient(), openClient(), openClient()]);
  clients[0].send(JSON.stringify({ type: "create_room", name: "Bir", fighter: "fox", arena: "sunset", onlineMode: "ffa4" }));
  const created = await nextMessage(clients[0], "room_created");
  assert.equal(created.maxPlayers, 4);
  assert.equal(created.roomMode, "ffa4");

  for (let index = 1; index < 3; index += 1) {
    const waiting = nextMessage(clients[index], "room_waiting");
    clients[index].send(JSON.stringify({ type: "join_room", code: created.code, name: `Oyuncu${index + 1}`, fighter: "rabbit" }));
    const state = await waiting;
    assert.equal(state.count, index + 1);
  }

  const starts = clients.map((client) => nextMessage(client, "match_start"));
  clients[3].send(JSON.stringify({ type: "join_room", code: created.code, name: "Dort", fighter: "owl" }));
  const matches = await Promise.all(starts);
  assert.equal(matches[3].playerIndex, 3);
  assert.equal(matches[0].players.length, 4);
  assert.deepEqual(matches[0].positions, [155, 455, 825, 1125]);

  const shots = clients.map((client) => nextMessage(client, "shoot"));
  clients[0].send(JSON.stringify({ type: "shoot", shot: { angle: 45, power: 60, weapon: "findik" } }));
  await Promise.all(shots);
  const syncs = clients.map((client) => nextMessage(client, "state_sync"));
  clients[0].send(JSON.stringify({ type: "state_sync", players: [{ hp: 100, x: 155 }, { hp: 0, x: 455 }, { hp: 100, x: 825 }, { hp: 100, x: 1125 }], craters: [], wind: 0 }));
  const synced = await Promise.all(syncs);
  assert.equal(synced[0].turn, 2);
  assert.equal(synced[2].players[1].hp, 0);
  clients.forEach((client) => client.close());
});

test("ikiye iki takim odasi takimlari ve takim zaferini senkronize eder", async () => {
  const clients = await Promise.all([openClient(), openClient(), openClient(), openClient()]);
  clients[0].send(JSON.stringify({ type: "create_room", name: "A1", fighter: "fox", arena: "mushroom", onlineMode: "team2v2", friendlyFire: false }));
  const created = await nextMessage(clients[0], "room_created");
  assert.equal(created.roomMode, "team2v2");
  assert.equal(created.friendlyFire, false);
  for (let index = 1; index < 3; index += 1) {
    const waiting = nextMessage(clients[index], "room_waiting");
    clients[index].send(JSON.stringify({ type: "join_room", code: created.code, name: `T${index}`, fighter: "cat" }));
    await waiting;
  }
  const starts = clients.map((client) => nextMessage(client, "match_start"));
  clients[3].send(JSON.stringify({ type: "join_room", code: created.code, name: "B2", fighter: "bear" }));
  const matches = await Promise.all(starts);
  assert.deepEqual(matches[0].players.map((player) => player.team), [0, 1, 0, 1]);

  const shots = clients.map((client) => nextMessage(client, "shoot"));
  clients[0].send(JSON.stringify({ type: "shoot", shot: { angle: 50, power: 55, weapon: "findik" } }));
  await Promise.all(shots);
  const syncs = clients.map((client) => nextMessage(client, "state_sync"));
  clients[0].send(JSON.stringify({ type: "state_sync", players: [{ hp: 75, x: 155 }, { hp: 0, x: 455 }, { hp: 40, x: 825 }, { hp: 0, x: 1125 }], craters: [], wind: 3 }));
  const synced = await Promise.all(syncs);
  assert.equal(synced[0].gameOver.winningTeam, 0);
  clients.forEach((client) => client.close());
});

test("silah yarisi zorunlu silahi ve isabet ilerlemesini senkronize eder", async () => {
  const host = await openClient();
  const guest = await openClient();
  host.send(JSON.stringify({ type: "create_room", name: "Yarisci", fighter: "fox", arena: "sunset", rules: { gameType: "weaponRace" } }));
  const created = await nextMessage(host, "room_created");
  const hostStart = nextMessage(host, "match_start");
  const guestStart = nextMessage(guest, "match_start");
  guest.send(JSON.stringify({ type: "join_room", code: created.code, name: "Rakip", fighter: "rabbit" }));
  const [started] = await Promise.all([hostStart, guestStart]);
  assert.equal(started.rules.gameType, "weaponRace");
  assert.equal(started.raceWeapons[0], "findik");
  assert.equal(started.ammo[0].findik, -1);
  assert.equal(started.ammo[0].meteor, -1);

  const shots = [nextMessage(host, "shoot"), nextMessage(guest, "shoot")];
  host.send(JSON.stringify({ type: "shoot", shot: { angle: 45, power: 60, weapon: "findik" } }));
  await Promise.all(shots);
  const syncs = [nextMessage(host, "state_sync"), nextMessage(guest, "state_sync")];
  host.send(JSON.stringify({ type: "state_sync", players: [{ hp: 100, x: 205 }, { hp: 0, x: 710, shield: 12, effects: { burn: 2 } }], craters: [] }));
  const [, synced] = await Promise.all(syncs);
  assert.equal(synced.weaponProgress[0], 1);
  assert.equal(synced.raceWeapons[1], "roket");
  assert.equal(synced.players[1].hp, 100);
  assert.equal(synced.players[1].x, 1075);
  assert.equal(synced.players[1].shield, 0);
  assert.deepEqual(synced.players[1].effects, {});
  assert.equal(synced.turn, 1);
  host.close(); guest.close();
});
