const $ = (selector) => document.querySelector(selector);
const canvas = $("#gameCanvas");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;
const assetUrl = (name) => new URL(`./assets/${name}`, import.meta.url).href;
const assetSources = {
  arenas: { sunset: assetUrl("arena-sunset-v2.webp"), mushroom: assetUrl("arena-mushroom-v3.webp"), aurora: assetUrl("arena-aurora-v3.webp") },
  duo: assetUrl("fighters-duo-v2.webp"), atlas: assetUrl("fighters-atlas-v3.webp"), ammo: assetUrl("ammo-atlas-v4.webp"), tacticalAmmo: assetUrl("tactical-ammo-atlas-v2.webp")
};
const art = { arenas: Object.fromEntries(Object.keys(assetSources.arenas).map((id) => [id, new Image()])), duo: new Image(), atlas: new Image(), ammo: new Image(), tacticalAmmo: new Image() };
function loadImage(image, source) {
  if (!image.src) image.src = source;
  if (image.complete && image.naturalWidth) return Promise.resolve();
  return image.decode?.().catch(() => {}) || Promise.resolve();
}
function prepareGameAssets(arenaId) {
  const safeArena = assetSources.arenas[arenaId] ? arenaId : "sunset";
  return Promise.all([
    loadImage(art.arenas[safeArena], assetSources.arenas[safeArena]), loadImage(art.duo, assetSources.duo), loadImage(art.atlas, assetSources.atlas),
    loadImage(art.ammo, assetSources.ammo), loadImage(art.tacticalAmmo, assetSources.tacticalAmmo)
  ]);
}

const ui = {
  menu: $("#menu"), lobby: $("#lobby"), game: $("#game"), status: $("#menuStatus"),
  name: $("#playerName"), roomInput: $("#roomInput"), roomCode: $("#roomCode"), copyHint: $("#copyHint"),
  p0Name: $("#p0Name"), p1Name: $("#p1Name"), p0Hp: $("#p0Hp"), p1Hp: $("#p1Hp"), p0Status: $("#p0Status"), p1Status: $("#p1Status"),
  p0Health: $("#p0Health"), p1Health: $("#p1Health"), turn: $("#turnLabel"), wind: $("#windLabel"), mode: $("#modeLabel"),
  angle: $("#angleInput"), power: $("#powerInput"), angleValue: $("#angleValue"), powerValue: $("#powerValue"),
  fire: $("#fireButton"), result: $("#resultOverlay"), resultTitle: $("#resultTitle"), rematch: $("#rematchButton"),
  moveEnergy: $("#moveEnergy"), moveLeft: $("#moveLeft"), moveRight: $("#moveRight"), jump: $("#jumpButton"), fireHint: $("#fireHint"), timer: $("#turnTimer"),
  fighterName: $("#fighterName"), arenaName: $("#arenaName"), onlineMode: $("#onlineMode"), friendlyFire: $("#friendlyFire"), onlineRoster: $("#onlineRoster"),
  ruleType: $("#ruleType"), ruleDescription: $("#ruleDescription"), ruleTurn: $("#ruleTurn"), ruleHp: $("#ruleHp"), ruleWind: $("#ruleWind"), ruleCrates: $("#ruleCrates"), ruleSudden: $("#ruleSudden"),
  practiceMode: $("#practiceMode"), botDifficulty: $("#botDifficulty")
};

const weapons = {
  findik: { label: "Fındık", col: 0, row: 0, damage: 29, radius: 58, speed: 1, count: 1, spread: 0, gravity: 1, wind: 1, crater: 1, color: "#ffcf49" },
  roket: { label: "Roket", col: 1, row: 0, damage: 40, radius: 72, speed: 1.08, count: 1, spread: 0, gravity: 1, wind: 1, crater: 1.1, color: "#ff6b5f" },
  ucleyen: { label: "Üçleyen", col: 2, row: 0, damage: 17, radius: 43, speed: .97, count: 3, spread: 7, gravity: 1, wind: 1, crater: .65, color: "#79f0cf" },
  buz: { label: "Buz Küresi", col: 3, row: 0, damage: 26, radius: 68, speed: .95, count: 1, spread: 0, gravity: .72, wind: 1.2, crater: .75, effect: "freeze", color: "#75dcff" },
  meteor: { label: "Meteor", col: 0, row: 1, damage: 55, radius: 94, speed: .83, count: 1, spread: 0, gravity: 1.28, wind: .55, crater: 1.4, effect: "burn", color: "#ff7a3d" },
  plazma: { label: "Plazma", col: 1, row: 1, damage: 34, radius: 60, speed: 1.3, count: 1, spread: 0, gravity: .88, wind: 0, crater: .8, color: "#d56dff" },
  seri: { label: "Beşli", col: 2, row: 1, damage: 10, radius: 31, speed: 1.02, count: 5, spread: 5, gravity: 1, wind: 1, crater: .42, color: "#fff29a" },
  seken: { label: "Seken Top", col: 3, row: 1, damage: 37, radius: 64, speed: 1.1, count: 1, spread: 0, gravity: 1.08, wind: .8, crater: 1, bounces: 1, color: "#ff78bd" }
  ,bomba: { label: "El Bombası", atlas: "tactical", col: 0, row: 0, damage: 34, radius: 67, speed: .88, count: 1, spread: 0, gravity: 1.2, wind: .65, crater: .9, bounces: 2, color: "#d7bd69" }
  ,yapiskan: { label: "Yapışkan", atlas: "tactical", col: 1, row: 0, damage: 44, radius: 70, speed: .92, count: 1, spread: 0, gravity: 1.05, wind: .7, crater: 1, special: "sticky", color: "#ff554d" }
  ,mayin: { label: "Mayın", atlas: "tactical", col: 2, row: 0, damage: 48, radius: 74, speed: .76, count: 1, spread: 0, gravity: 1.3, wind: .45, crater: 1, special: "mine", color: "#a7a269" }
  ,hava: { label: "Hava Akını", atlas: "tactical", col: 3, row: 0, damage: 11, radius: 42, speed: 1.15, count: 1, spread: 0, gravity: .9, wind: .25, crater: .38, special: "airstrike", color: "#ff8d35" }
  ,matkap: { label: "Matkap", atlas: "tactical", col: 0, row: 1, damage: 25, radius: 62, speed: 1.16, count: 1, spread: 0, gravity: .9, wind: .75, crater: 2.15, color: "#ff7542" }
  ,itici: { label: "İtici", atlas: "tactical", col: 1, row: 1, damage: 15, radius: 95, speed: 1.04, count: 1, spread: 0, gravity: .9, wind: .2, crater: .35, knockback: 125, effect: "stun", color: "#56e8ff" }
  ,zehir: { label: "Zehir", atlas: "tactical", col: 2, row: 1, damage: 16, radius: 75, speed: .96, count: 1, spread: 0, gravity: 1.05, wind: .85, crater: .45, effect: "poison", color: "#73f23d" }
  ,isinla: { label: "Işınlan", atlas: "tactical", col: 3, row: 1, damage: 0, radius: 28, speed: 1.08, count: 1, spread: 0, gravity: .85, wind: .15, crater: 0, special: "teleport", color: "#b85cff" }
};

const fighters = {
  fox: { name: "KIZIL KAPTAN", sheet: "duo", col: 0, row: 0, cols: 2, rows: 1, nativeFacing: 1, anchorX: 88, anchorY: -158 },
  raccoon: { name: "MAVİ MÜHENDİS", sheet: "duo", col: 1, row: 0, cols: 2, rows: 1, nativeFacing: -1, anchorX: 84, anchorY: -181 },
  rabbit: { name: "GÖKYÜZÜ İZCİ", sheet: "atlas", col: 0, row: 0, cols: 2, rows: 2, nativeFacing: 1, anchorX: 78, anchorY: -178 },
  owl: { name: "GECE SİMYACISI", sheet: "atlas", col: 1, row: 0, cols: 2, rows: 2, nativeFacing: -1, anchorX: 82, anchorY: -179 },
  bear: { name: "ORMAN MUHAFIZI", sheet: "atlas", col: 0, row: 1, cols: 2, rows: 2, nativeFacing: 1, anchorX: 79, anchorY: -180 },
  cat: { name: "GÖLGE NİŞANCI", sheet: "atlas", col: 1, row: 1, cols: 2, rows: 2, nativeFacing: -1, anchorX: 88, anchorY: -177 }
};

const arenas = {
  sunset: { name: "GÜNBATIMI VADİSİ", gravity: 380, wind: 18, roughness: 1, top: "#75bc68", ground: ["#264d3c", "#18382f", "#091817"] },
  mushroom: { name: "AY MANTARI ORMANI", gravity: 325, wind: 24, roughness: 1.25, top: "#48d7be", ground: ["#253b47", "#17283d", "#0a1329"] },
  aurora: { name: "KUTUP IŞIKLARI", gravity: 430, wind: 12, roughness: .82, top: "#8be5ed", ground: ["#245268", "#123446", "#071b2b"] }
};

let screen = "menu";
let mode = "practice";
let socket = null;
let localIndex = 0;
let room = null;
let selectedWeapon = "findik";
let selectedFighter = "fox";
let selectedArena = "sunset";
let practiceRule = "duel";
let selectedDifficulty = "normal";
let selectedOnlineMode = "duel";
let friendlyFireEnabled = false;
const defaultRules = () => ({ turnSeconds: 25, startingHp: 100, wind: "normal", crates: "normal", suddenDeathTurn: 12, gameType: "classic" });
const defaultRaceWeapons = ["findik", "roket", "buz", "bomba", "seken", "itici", "zehir", "meteor"];
let soundEnabled = true;
let audioContext = null;
let game = null;
let lastTime = performance.now();
let accumulator = 0;
let lastRender = 0;
const movement = { left: false, right: false, netTimer: 0 };
const charge = { active: false, direction: 1 };
const lowPowerDevice = innerWidth <= 560 || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 4) || matchMedia("(prefers-reduced-motion: reduce)").matches;
const performanceProfile = { physicsStep: 1 / 60, frameInterval: 1000 / (lowPowerDevice ? 30 : 60), maxParticles: lowPowerDevice ? 80 : 180, maxTrail: lowPowerDevice ? 12 : 24, shadows: !lowPowerDevice };
const particlePool = [];
const freshAmmo = () => ({ findik: -1, roket: 4, ucleyen: 3, buz: 3, meteor: 2, plazma: 3, seri: 3, seken: 3, bomba: 4, yapiskan: 2, mayin: 2, hava: 2, matkap: 2, itici: 3, zehir: 2, isinla: 2 });

function emitParticle(data) {
  const particle = particlePool.pop() || {};
  Object.assign(particle, data);
  game.particles.push(particle);
}

function mulberry32(seed) {
  return function random() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function newGame(seed, combatants, startingTurn = 0, arenaId = "sunset", suppliedRules = {}) {
  const random = mulberry32(seed);
  const matchRules = { ...defaultRules(), ...suppliedRules };
  const safeArenaId = arenas[arenaId] ? arenaId : "sunset";
  const roster = combatants.map((entry, index) => typeof entry === "string" ? { name: entry, fighter: index ? "raccoon" : "fox" } : entry);
  const terrain = {
    seed,
    phaseA: random() * 6.28,
    phaseB: random() * 6.28,
    phaseC: random() * 6.28,
    craters: [], heightMap: null, cacheStep: 2, layer: null, layerDirty: true,
    hills: Array.from({ length: 7 }, (_, index) => ({
      x: 90 + index * 185 + (random() * 70 - 35),
      width: 75 + random() * 80,
      height: (index % 2 ? 1 : -1) * (18 + random() * 42)
    }))
  };
  game = {
    terrain,
    players: roster.map((entry, index) => {
      const spawnXs = roster.length === 4 ? [155, 455, 825, 1125] : [205, 1075];
      const colors = ["#ffad32", "#59dfbd", "#7fc7ff", "#d884ff"];
      return { name: entry?.name || `Oyuncu ${index + 1}`, fighter: fighters[entry?.fighter] ? entry.fighter : Object.keys(fighters)[index % Object.keys(fighters).length], team: Number.isInteger(entry?.team) ? entry.team : null, equipped: localIndex === index ? selectedWeapon : "findik", recoil: 0, weaponSwap: 0, muzzleFlash: 0, walk: 0, walkPhase: 0, airborne: false, platformId: null, vy: 0, hp: matchRules.startingHp, shield: 0, effects: {}, x: spawnXs[index], y: 0, color: colors[index], accent: "#273c69", facing: spawnXs[index] < W / 2 ? 1 : -1 };
    }),
    arena: safeArenaId,
    moveBudget: Array(roster.length).fill(160),
    ammo: Array.from({ length: roster.length }, freshAmmo),
    turnEndsAt: Date.now() + matchRules.turnSeconds * 1000,
    lastTimer: null,
    turnNumber: 1,
    wave: 1,
    dangerInset: 0,
    turn: startingTurn,
    wind: Math.round((random() * 2 - 1) * arenas[safeArenaId].wind * (matchRules.wind === "low" ? .55 : matchRules.wind === "high" ? 1.7 : 1)),
    projectiles: [], mines: [], stickyBombs: [], particles: [], explosions: [], damageNumbers: [], shake: 0, flash: 0,
    shotResolving: false, awaitingSync: false, settleTimer: 0, gameOver: null, authorityIndex: 0, roomMode: "duel", friendlyFire: false, rules: matchRules, maxHp: matchRules.startingHp,
    objective: { x: 640, radius: 92, target: 3, scores: Array(roster.length).fill(0) }, weaponProgress: Array(roster.length).fill(0), raceWeapons: defaultRaceWeapons, chaosModifier: null,
    clouds: Array.from({ length: 7 }, () => ({ x: random() * W, y: 70 + random() * 210, size: 35 + random() * 65, speed: 3 + random() * 7 }))
  };
  rebuildTerrainCache();
  const pickupTypes = ["health", "ammo", "shield", "ammo", "health"];
  const pickupCount = matchRules.crates === "scarce" ? 2 : matchRules.crates === "abundant" ? 5 : 3;
  game.pickups = Array.from({ length: pickupCount }, (_, index) => { let x = (index + 1) * W / (pickupCount + 1) + Math.round((random() - .5) * 24); if (game.players.some((player) => Math.abs(player.x - x) < 90)) x = Math.max(90, Math.min(1190, x + (x < W / 2 ? 95 : -95))); return { id: index, type: pickupTypes[index], x, taken: false, bob: random() * 6.28 }; });
  const barrelBases = game.players.length === 4 ? [300, 980] : [455, 825];
  game.barrels = barrelBases.map((x, index) => ({ id: index, x: x + Math.round((random() - .5) * 26), destroyed: false }));
  game.platforms = [0, 1].map((id) => { const x = 330 + id * 510 + Math.round((random() - .5) * 45); return { id, x, y: terrainY(x) - 105 - id * 18, width: 125, hp: 2 }; });
  settlePlayers();
  updateHud();
  ui.result.classList.add("hidden");
}

function rawTerrainY(x) {
  if (!game) return 540;
  const t = game.terrain;
  const roughness = arenas[game.arena]?.roughness || 1;
  let y = 512 + Math.sin(x * .0062 + t.phaseA) * 38 * roughness + Math.sin(x * .014 + t.phaseB) * 21 * roughness + Math.sin(x * .002 + t.phaseC) * 28;
  for (const hill of t.hills) {
    const distance = x - hill.x;
    y += hill.height * Math.exp(-(distance * distance) / (2 * hill.width * hill.width));
  }
  for (const crater of t.craters) {
    const dx = Math.abs(x - crater.x);
    if (dx < crater.radius) y += crater.depth * Math.sqrt(1 - (dx * dx) / (crater.radius * crater.radius));
  }
  return Math.min(645, y);
}

function rebuildTerrainCache() {
  if (!game) return;
  const terrain = game.terrain;
  const count = Math.ceil(W / terrain.cacheStep) + 1;
  terrain.heightMap = new Float32Array(count);
  for (let index = 0; index < count; index += 1) terrain.heightMap[index] = rawTerrainY(Math.min(W, index * terrain.cacheStep));
  terrain.layerDirty = true;
}

function terrainY(x) {
  if (!game) return 540;
  if (!game.terrain.heightMap) rebuildTerrainCache();
  const clamped = Math.max(0, Math.min(W, x));
  const position = clamped / game.terrain.cacheStep;
  const left = Math.floor(position);
  const right = Math.min(game.terrain.heightMap.length - 1, left + 1);
  const ratio = position - left;
  return game.terrain.heightMap[left] * (1 - ratio) + game.terrain.heightMap[right] * ratio;
}

function settlePlayers() {
  if (!game) return;
  for (const player of game.players) if (!player.airborne) {
    const platform = game.platforms?.find((item) => item.id === player.platformId && item.hp > 0 && Math.abs(player.x - item.x) <= item.width / 2);
    if (platform) { player.y = platform.y - 29; continue; }
    player.platformId = null;
    let floor = terrainY(player.x);
    if (floor >= 638 && game.terrain.craters.length) {
      const oldX = player.x;
      for (let offset = 45; offset <= 360; offset += 45) { const left = Math.max(70, oldX - offset); const right = Math.min(1210, oldX + offset); if (terrainY(left) < 620) { player.x = left; break; } if (terrainY(right) < 620) { player.x = right; break; } }
      player.hp = Math.max(0, player.hp - 12); floor = terrainY(player.x);
      game.damageNumbers.push({ x: player.x, y: floor - 100, value: "12 DÜŞME", life: 1.2, color: "#ff826f" });
    }
    player.y = floor - 29;
  }
}

function surfaceAt(x) {
  if (game.arena === "sunset") { if (x >= 315 && x <= 455) return "mud"; if (x >= 575 && x <= 705) return "lava"; }
  if (game.arena === "mushroom") { if (x >= 515 && x <= 695) return "water"; if (x >= 790 && x <= 900) return "spores"; }
  if (game.arena === "aurora") { if (x >= 335 && x <= 520) return "ice"; if (x >= 720 && x <= 845) return "thinIce"; }
  return null;
}

function surfaceCostAt(x) { const surface = surfaceAt(x); return surface === "mud" ? 1.7 : surface === "water" ? 1.45 : surface === "ice" ? .65 : 1; }

function showScreen(name) {
  screen = name;
  ui.menu.classList.toggle("hidden", name !== "menu");
  ui.lobby.classList.toggle("hidden", name !== "lobby");
  ui.game.classList.toggle("hidden", name !== "game");
  if (name === "game") updateHud();
}

function playerName() {
  return ui.name.value.trim().slice(0, 18) || "Cesur Pati";
}

function startPractice() {
  closeSocket();
  prepareGameAssets(selectedArena);
  mode = "practice";
  practiceRule = ui.practiceMode.value;
  selectedDifficulty = ui.botDifficulty.value;
  localIndex = 0;
  room = null;
  const rivals = Object.keys(fighters).filter((id) => id !== selectedFighter);
  const rival = rivals[Math.floor(Math.random() * rivals.length)];
  newGame(Math.floor(Math.random() * 1_000_000), [{ name: playerName(), fighter: selectedFighter }, { name: fighters[rival].name, fighter: rival }], 0, selectedArena);
  ui.mode.textContent = "ANTRENMAN";
  showScreen("game");
}

function socketUrl() {
  const endpoint = new URL(".", location.href);
  endpoint.protocol = location.protocol === "https:" ? "wss:" : "ws:";
  endpoint.search = ""; endpoint.hash = "";
  return endpoint.href;
}

function connect(onOpen) {
  closeSocket();
  ui.status.textContent = "Sunucuya bağlanılıyor…";
  socket = new WebSocket(socketUrl());
  socket.addEventListener("open", onOpen, { once: true });
  socket.addEventListener("message", onMessage);
  socket.addEventListener("close", () => {
    if (mode === "online" && screen !== "menu") showResult("Bağlantı kesildi", false);
  });
  socket.addEventListener("error", () => { ui.status.textContent = "Sunucuya bağlanılamadı."; });
}

function closeSocket() {
  if (socket) {
    mode = "practice";
    socket.onclose = null;
    socket.close();
    socket = null;
  }
}

function send(type, payload = {}) {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type, ...payload }));
}

function createRoom() {
  mode = "online";
  selectedOnlineMode = ui.onlineMode.value;
  friendlyFireEnabled = ui.friendlyFire.value === "on";
  const rules = { gameType: ui.ruleType.value, turnSeconds: Number(ui.ruleTurn.value), startingHp: Number(ui.ruleHp.value), wind: ui.ruleWind.value, crates: ui.ruleCrates.value, suddenDeathTurn: Number(ui.ruleSudden.value) };
  prepareGameAssets(selectedArena);
  connect(() => send("create_room", { name: playerName(), fighter: selectedFighter, arena: selectedArena, onlineMode: selectedOnlineMode, friendlyFire: friendlyFireEnabled, rules }));
}

function joinRoom() {
  const code = ui.roomInput.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
  if (code.length !== 5) { ui.status.textContent = "5 karakterli oda kodunu gir."; return; }
  mode = "online";
  connect(() => send("join_room", { name: playerName(), code, fighter: selectedFighter, arena: selectedArena }));
}

function onMessage(event) {
  let message;
  try { message = JSON.parse(event.data); } catch { return; }
  if (message.type === "error") { ui.status.textContent = message.message; return; }
  if (message.type === "room_created") {
    room = message.code;
    localIndex = message.playerIndex;
    ui.roomCode.textContent = room;
    selectedOnlineMode = message.roomMode || "duel";
    friendlyFireEnabled = Boolean(message.friendlyFire);
    ui.copyHint.textContent = `1/${message.maxPlayers || 2} oyuncu · Kodu paylaş`;
    showScreen("lobby");
    return;
  }
  if (message.type === "room_waiting") { if (Number.isFinite(Number(message.playerIndex))) localIndex = Number(message.playerIndex); ui.copyHint.textContent = `${message.count}/${message.maxPlayers} oyuncu bağlandı`; return; }
  if (message.type === "match_start") {
    room = message.code;
    localIndex = Number(message.playerIndex);
    prepareGameAssets(message.arena);
    newGame(message.seed, message.players, message.turn, message.arena, message.rules);
    selectedOnlineMode = message.roomMode || "duel";
    friendlyFireEnabled = Boolean(message.friendlyFire); game.roomMode = selectedOnlineMode; game.friendlyFire = friendlyFireEnabled;
    game.authorityIndex = Number(message.authorityIndex) || 0;
    if (Number.isFinite(Number(message.wind))) game.wind = Number(message.wind);
    if (message.objective) game.objective = message.objective;
    if (Array.isArray(message.weaponProgress)) game.weaponProgress = message.weaponProgress.map(Number);
    if (Array.isArray(message.raceWeapons)) game.raceWeapons = message.raceWeapons;
    game.chaosModifier = message.chaosModifier || null;
    if (Array.isArray(message.positions)) message.positions.forEach((x, index) => { if (game.players[index]) game.players[index].x = Number(x); });
    if (Array.isArray(message.moveBudget)) game.moveBudget = message.moveBudget.map(Number);
    if (Array.isArray(message.ammo)) game.ammo = message.ammo;
    game.turnEndsAt = Number(message.turnEndsAt) || Date.now() + game.rules.turnSeconds * 1000;
    game.turnNumber = Number(message.turnNumber) || 1; game.dangerInset = Number(message.dangerInset) || 0;
    settlePlayers();
    syncForcedWeapon();
    ui.mode.textContent = `ODA ${room}`;
    showScreen("game");
    ui.onlineRoster.classList.toggle("hidden", game.players.length < 3);
    if (game.turn !== localIndex) pulse("Rakip başlıyor");
    return;
  }
  if (message.type === "shoot") {
    if (Array.isArray(message.ammo)) game.ammo = message.ammo;
    beginShot(message.playerIndex, message.shot);
    return;
  }
  if (message.type === "move" && game) {
    const player = game.players[message.playerIndex];
    if (player) { player.x = Number(message.x); player.walk = 1; player.walkPhase += .7; game.moveBudget[message.playerIndex] = Number(message.budget); settlePlayers(); updateMoveControls(); }
    return;
  }
  if (message.type === "jump" && game) {
    const player = game.players[message.playerIndex];
    if (player && !player.airborne) { game.moveBudget[message.playerIndex] = Number(message.budget); player.airborne = true; player.vy = -285; player.walk = 1; beep(310, .08, "sine"); updateHud(); }
    return;
  }
  if (message.type === "state_sync" && game) {
    const revivedPlayers = [];
    message.players?.forEach((player, index) => { if (game.players[index]) { const incomingHp = Math.max(0, Number(player.hp)); if (game.rules.gameType === "weaponRace" && game.players[index].hp <= 0 && incomingHp > 0) revivedPlayers.push(game.players[index].name); game.players[index].hp = incomingHp; game.players[index].shield = Math.max(0, Number(player.shield) || 0); game.players[index].effects = player.effects && typeof player.effects === "object" ? player.effects : {}; if (Number.isFinite(Number(player.x))) game.players[index].x = Number(player.x); } });
    if (Array.isArray(message.moveBudget)) game.moveBudget = message.moveBudget.map(Number);
    if (Array.isArray(message.ammo)) game.ammo = message.ammo;
    game.turnEndsAt = Number(message.turnEndsAt) || Date.now() + game.rules.turnSeconds * 1000;
    game.turnNumber = Number(message.turnNumber) || game.turnNumber; game.dangerInset = Number(message.dangerInset) || 0;
    if (message.objective) game.objective = message.objective;
    if (Array.isArray(message.weaponProgress)) game.weaponProgress = message.weaponProgress.map(Number);
    if (Array.isArray(message.raceWeapons)) game.raceWeapons = message.raceWeapons;
    game.chaosModifier = message.chaosModifier || null;
    if (Array.isArray(message.craters)) { game.terrain.craters = message.craters.slice(-18); rebuildTerrainCache(); }
    if (Array.isArray(message.barrels)) message.barrels.forEach((barrel, index) => { if (game.barrels[index]) game.barrels[index].destroyed = Boolean(barrel.destroyed); });
    if (Array.isArray(message.platforms)) message.platforms.forEach((platform, index) => { if (game.platforms[index]) game.platforms[index].hp = Math.max(0, Number(platform.hp) || 0); });
    game.wind = Number(message.wind) || 0;
    game.turn = message.turn;
    game.shotResolving = false;
    game.awaitingSync = false;
    settlePlayers();
    syncForcedWeapon();
    updateHud();
    if (revivedPlayers.length) pulse(`${revivedPlayers.join(", ")} yeniden doğdu`);
    if (message.gameOver) finishGame(message.gameOver);
    return;
  }
  if (message.type === "turn_timeout" && game) {
    game.turn = Number(message.turn);
    game.moveBudget = message.moveBudget.map(Number);
    game.turnEndsAt = Number(message.turnEndsAt);
    game.turnNumber = Number(message.turnNumber) || game.turnNumber; game.dangerInset = Number(message.dangerInset) || game.dangerInset;
    if (message.objective) game.objective = message.objective;
    if (Array.isArray(message.weaponProgress)) game.weaponProgress = message.weaponProgress.map(Number);
    game.chaosModifier = message.chaosModifier || null;
    if (Number.isFinite(Number(message.wind))) game.wind = Number(message.wind);
    applyTurnEffects(game.turn);
    charge.active = false; ui.fire.classList.remove("charging"); ui.fireHint.textContent = "BASILI TUT";
    pulse(message.expiredPlayer === localIndex ? "Süren doldu" : "Rakibin süresi doldu");
    updateHud();
    if (message.gameOver) finishGame(message.gameOver);
    return;
  }
  if (message.type === "player_left" && game) { const player = game.players[message.playerIndex]; if (player) { player.hp = 0; player.disconnected = true; } game.turn = Number(message.turn); game.authorityIndex = Number(message.authorityIndex); game.turnEndsAt = Number(message.turnEndsAt); pulse(`${message.name} ayrıldı`); updateHud(); return; }
  if (message.type === "match_abandoned" && game) { finishGame({ winner: message.winner, winningTeam: message.winningTeam, reason: message.reason }); return; }
  if (message.type === "room_expired") { closeSocket(); ui.status.textContent = message.message; showScreen("menu"); return; }
  if (message.type === "opponent_left") showResult(`${message.name} ayrıldı`, false);
}

function canShoot() {
  const forced = game?.rules.gameType === "weaponRace" ? game.raceWeapons[game.weaponProgress[localIndex]] : null;
  return screen === "game" && game && !game.gameOver && !game.shotResolving && game.projectiles.length === 0 && game.turn === localIndex && game.players[localIndex].hp > 0 && !game.players[localIndex].airborne && game.ammo[localIndex][selectedWeapon] !== 0 && (!forced || selectedWeapon === forced);
}

function syncForcedWeapon() {
  if (!game || game.rules.gameType !== "weaponRace") return;
  const forced = game.raceWeapons[game.weaponProgress[localIndex]];
  if (!forced) return; selectedWeapon = forced; game.players[localIndex].equipped = forced;
  document.querySelectorAll(".weapon").forEach((button) => button.classList.toggle("selected", button.dataset.weapon === forced));
}

function arenaConfig() { const base = arenas[game?.arena] || arenas.sunset; return game?.chaosModifier === "lowGravity" ? { ...base, gravity: base.gravity * .52 } : base; }
function randomWind() { let scale = game.rules.wind === "low" ? .55 : game.rules.wind === "high" ? 1.7 : 1; if (game.chaosModifier === "superWind") scale *= 2.1; return Math.round((Math.random() * 2 - 1) * arenaConfig().wind * scale); }

function canMove(playerIndex = localIndex) {
  return screen === "game" && game && !game.gameOver && !game.shotResolving && game.turn === playerIndex && game.players[playerIndex].hp > 0 && game.moveBudget[playerIndex] > .5;
}

function movementCandidate(playerIndex, direction, amount) {
  const player = game.players[playerIndex];
  const budget = game.moveBudget[playerIndex];
  const cost = surfaceCostAt(player.x);
  const step = Math.min(amount, budget / cost);
  const x = Math.max(70, Math.min(1210, player.x + direction * step));
  if (game.players.some((other, index) => index !== playerIndex && other.hp > 0 && Math.abs(x - other.x) < 110)) return null;
  if (!player.airborne && Math.abs(terrainY(x) - terrainY(player.x)) > Math.max(8, step * 1.7)) return null;
  return { x, spent: Math.abs(x - player.x) * cost };
}

function applyMovement(playerIndex, direction, amount) {
  if (!canMove(playerIndex)) return false;
  const candidate = movementCandidate(playerIndex, direction, amount);
  if (!candidate || candidate.spent <= 0) return false;
  const player = game.players[playerIndex];
  player.x = candidate.x;
  player.walk = 1;
  player.walkPhase += candidate.spent * .1;
  game.moveBudget[playerIndex] = Math.max(0, game.moveBudget[playerIndex] - candidate.spent);
  if (!player.airborne && player.platformId !== null) {
    const platform = game.platforms.find((item) => item.id === player.platformId && item.hp > 0);
    if (platform && Math.abs(player.x - platform.x) <= platform.width / 2) player.y = platform.y - 29;
    else { player.platformId = null; player.airborne = true; player.vy = 0; }
  } else if (!player.airborne) player.y = terrainY(player.x) - 29;
  if (Math.floor(player.walkPhase) % 4 === 0) emitParticle({ x: player.x - direction * 18, y: terrainY(player.x) - 3, vx: -direction * 12, vy: -18, life: .35, size: 3, color: "rgba(220,205,165,.65)" });
  updateMoveControls();
  return true;
}

function requestNetworkMove(direction, distance = 6) {
  if (!canMove()) return;
  const safeDistance = Math.max(1, Math.min(10, distance));
  if (!movementCandidate(localIndex, direction, safeDistance)) return;
  send("move", { direction, distance: safeDistance });
}

function performJump(playerIndex) {
  const player = game?.players[playerIndex];
  if (!player || player.airborne || !canMove(playerIndex) || game.moveBudget[playerIndex] < 28) return false;
  player.airborne = true;
  player.platformId = null;
  player.vy = -285;
  game.moveBudget[playerIndex] -= 28;
  player.walk = 1;
  beep(310, .08, "sine");
  updateHud();
  return true;
}

function requestJump() {
  if (!canMove() || game.players[localIndex].airborne || game.moveBudget[localIndex] < 28) return;
  if (mode === "online") send("jump"); else performJump(localIndex);
}

function startCharge() {
  if (!canShoot() || charge.active) return;
  charge.active = true; charge.direction = 1;
  ui.power.value = 15; ui.power.dispatchEvent(new Event("input"));
  ui.fire.classList.add("charging"); ui.fireHint.textContent = "GÜÇ DOLUYOR";
}

function releaseCharge() {
  if (!charge.active) return;
  charge.active = false;
  ui.fire.classList.remove("charging"); ui.fireHint.textContent = "BASILI TUT";
  requestShot();
}

function muzzlePosition(player) {
  const fighter = fighters[player.fighter] || fighters.fox;
  const ground = player.y + 29;
  return { x: player.x + player.facing * (fighter.anchorX + 42), y: ground + fighter.anchorY };
}

function requestShot() {
  if (!canShoot()) return;
  const shot = { angle: Number(ui.angle.value), power: Number(ui.power.value), weapon: selectedWeapon };
  if (mode === "online") send("shoot", { shot }); else beginShot(localIndex, shot);
}

function beginShot(playerIndex, shot) {
  if (!game || game.shotResolving) return;
  const shooter = game.players[playerIndex];
  const baseWeapon = weapons[shot.weapon] || weapons.findik;
  const weapon = game.chaosModifier === "megaBlast" ? { ...baseWeapon, damage: baseWeapon.damage * 1.35, radius: baseWeapon.radius * 1.45, crater: baseWeapon.crater * 1.3 } : baseWeapon;
  if (mode !== "online" && game.ammo[playerIndex][shot.weapon] > 0) game.ammo[playerIndex][shot.weapon] -= 1;
  shooter.equipped = shot.weapon;
  shooter.recoil = 1;
  shooter.muzzleFlash = 1;
  const muzzle = muzzlePosition(shooter);
  const baseAngle = Number(shot.angle) * Math.PI / 180;
  const speed = (290 + Number(shot.power) * 4.35) * weapon.speed;
  game.shotResolving = true;
  game.settleTimer = 0;
  for (let i = 0; i < weapon.count; i += 1) {
    const offset = (i - (weapon.count - 1) / 2) * weapon.spread * Math.PI / 180;
    const angle = baseAngle + offset;
    game.projectiles.push({
      x: muzzle.x,
      y: muzzle.y,
      vx: Math.cos(angle) * speed * shooter.facing,
      vy: -Math.sin(angle) * speed,
      age: 0,
      owner: playerIndex,
      damage: weapon.damage,
      radius: weapon.radius,
      color: weapon.color,
      weapon: shot.weapon,
      gravity: weapon.gravity,
      wind: weapon.wind,
      crater: weapon.crater,
      effect: weapon.effect || null,
      knockback: weapon.knockback || 0,
      special: weapon.special || null,
      bounces: (weapon.bounces || 0) + (game.chaosModifier === "bouncy" ? 2 : 0),
      trail: []
    });
  }
  beep(220, .08, "square");
  updateHud();
}

function impact(projectile) {
  if (projectile.special === "teleport") {
    const owner = game.players[projectile.owner]; owner.x = Math.max(70, Math.min(1210, projectile.x)); owner.airborne = false; owner.y = terrainY(owner.x) - 29;
    game.explosions.push({ x: owner.x, y: owner.y - 70, life: 1, radius: 52, color: projectile.color }); beep(720, .2, "sine"); return;
  }
  if (projectile.crater > 0) {
    game.terrain.craters.push({ x: projectile.x, radius: projectile.radius * .75 * projectile.crater, depth: projectile.radius * .32 * projectile.crater });
    game.terrain.craters = game.terrain.craters.slice(-18);
    rebuildTerrainCache();
  }
  game.explosions.push({ x: projectile.x, y: projectile.y, life: 1, radius: projectile.radius, color: projectile.color });
  game.shake = Math.max(game.shake, projectile.radius * .13);
  game.flash = Math.max(game.flash, .28);
  game.players.forEach((player, playerIndex) => {
    const distance = Math.hypot(player.x - projectile.x, player.y - 88 - projectile.y);
    if (distance < projectile.radius) {
      const protectedTeammate = game.roomMode === "team2v2" && !game.friendlyFire && playerIndex !== projectile.owner && player.team === game.players[projectile.owner].team;
      if (protectedTeammate) return;
      const damage = Math.max(4, Math.round(projectile.damage * (1 - distance / (projectile.radius * 1.25))));
      const absorbed = Math.min(player.shield || 0, damage);
      player.shield = Math.max(0, (player.shield || 0) - absorbed);
      const healthDamage = damage - absorbed;
      player.hp = Math.max(0, player.hp - healthDamage);
      game.damageNumbers.push({ x: player.x, y: player.y - 150, value: absorbed ? `${healthDamage}  🛡${absorbed}` : damage, life: 1, color: playerIndex === 0 ? "#ffc44d" : "#64edcf" });
      if (projectile.effect && playerIndex !== projectile.owner) player.effects[projectile.effect] = Math.max(player.effects[projectile.effect] || 0, projectile.effect === "stun" ? 1 : 2);
      if (projectile.knockback) { const direction = Math.sign(player.x - projectile.x) || (playerIndex ? 1 : -1); player.x = Math.max(70, Math.min(1210, player.x + direction * projectile.knockback * (1 - distance / projectile.radius))); player.y = terrainY(player.x) - 29; }
    }
  });
  for (let i = 0; i < 48; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 45 + Math.random() * 210;
    emitParticle({ x: projectile.x, y: projectile.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 70, life: .45 + Math.random() * .7, size: 2 + Math.random() * 5, color: i % 3 ? projectile.color : "#fff5ca" });
  }
  beep(75, .18, "sawtooth");
  if (projectile.special === "airstrike") {
    for (let i = -2; i <= 2; i += 1) game.projectiles.push({ x: projectile.x + i * 42, y: -30 - Math.abs(i) * 16, vx: game.wind * .35, vy: 250, age: .3, owner: projectile.owner, damage: 11, radius: 42, color: "#ff8d35", weapon: "hava", gravity: 1.2, wind: .15, crater: .38, bounces: 0, effect: null, knockback: 0, special: null, trail: [] });
  }
  for (const barrel of game.barrels) {
    if (!barrel.destroyed && Math.abs(barrel.x - projectile.x) < projectile.radius + 38) explodeBarrel(barrel, projectile.owner);
  }
  settlePlayers();
  updateHud();
}

function explodeBarrel(barrel, owner) {
  if (barrel.destroyed) return;
  barrel.destroyed = true;
  const y = terrainY(barrel.x) - 18;
  impact({ x: barrel.x, y, owner, damage: 32, radius: 82, color: "#ff963d", weapon: "roket", gravity: 1, wind: 0, crater: .8, bounces: 0, effect: "burn", knockback: 72, special: null, trail: [] });
}

function applyTurnEffects(playerIndex) {
  const player = game.players[playerIndex];
  const modifiers = { freeze: Boolean(player.effects.freeze), stun: Boolean(player.effects.stun) };
  let damage = 0;
  const surface = surfaceAt(player.x);
  if (surface === "water") delete player.effects.burn;
  if (player.effects.burn) damage += 6;
  if (player.effects.poison) damage += 8;
  if (surface === "lava") damage += 12;
  if (surface === "spores") player.effects.poison = Math.max(player.effects.poison || 0, 2);
  if (surface === "thinIce") { game.terrain.craters.push({ x: player.x, radius: 34, depth: 18 }); game.terrain.craters = game.terrain.craters.slice(-18); rebuildTerrainCache(); }
  if (game.dangerInset > 0 && (player.x < game.dangerInset || player.x > W - game.dangerInset)) damage += 14;
  if (damage) { player.hp = Math.max(0, player.hp - damage); game.damageNumbers.push({ x: player.x, y: player.y - 160, value: `${damage} ETKİ`, life: 1.2, color: "#9af45b" }); }
  for (const effect of Object.keys(player.effects)) { player.effects[effect] -= 1; if (player.effects[effect] <= 0) delete player.effects[effect]; }
  return modifiers;
}

function nextLivingPlayer(fromIndex) {
  for (let step = 1; step <= game.players.length; step += 1) { const index = (fromIndex + step) % game.players.length; if (game.players[index].hp > 0 && !game.players[index].disconnected) return index; }
  return fromIndex;
}

function finishShot() {
  let dead = game.players.findIndex((player) => player.hp <= 0);
  const nextPlayer = nextLivingPlayer(game.turn);
  const livingBeforeEffects = game.players.filter((player) => player.hp > 0 && !player.disconnected).length;
  const turnModifiers = livingBeforeEffects > 1 ? applyTurnEffects(nextPlayer) : { freeze: false, stun: false };
  const alive = game.players.map((player, index) => player.hp > 0 && !player.disconnected ? index : -1).filter((index) => index >= 0);
  dead = game.players.findIndex((player) => player.hp <= 0);
  const aliveTeams = [...new Set(alive.map((index) => game.players[index].team))];
  const gameOver = game.roomMode === "team2v2" ? (aliveTeams.length <= 1 ? { winningTeam: aliveTeams[0] ?? null } : null) : (alive.length <= 1 ? { winner: alive[0] ?? null } : null);
  if (mode === "practice" && practiceRule === "survival" && dead === 1) { startNextWave(); return; }
  if (mode === "online") {
    game.awaitingSync = true;
    if (localIndex === game.authorityIndex) {
      send("state_sync", {
        players: game.players.map(({ hp, shield, effects, x }) => ({ hp, shield, effects, x })),
        craters: game.terrain.craters,
        barrels: game.barrels.map(({ id, destroyed }) => ({ id, destroyed })),
        platforms: game.platforms.map(({ id, hp }) => ({ id, hp })),
        gameOver,
        turnModifiers
      });
    }
  } else if (gameOver) {
    finishGame(gameOver);
  } else {
    game.turn = nextPlayer;
    game.turnNumber += 1;
    if (game.rules.suddenDeathTurn > 0 && game.turnNumber > game.rules.suddenDeathTurn) game.dangerInset = Math.min(430, game.dangerInset + 28);
    game.moveBudget[game.turn] = 160;
    if (turnModifiers.freeze) game.moveBudget[game.turn] -= 55;
    game.turnEndsAt = Date.now() + (turnModifiers.stun ? Math.max(8_000, (game.rules.turnSeconds - 10) * 1000) : game.rules.turnSeconds * 1000);
    game.wind = randomWind();
    game.shotResolving = false;
    updateHud();
    if (game.turn === 1) window.setTimeout(botShot, 800);
  }
}

const botLevels = {
  easy: { angleStep: 10, powerStep: 14, angleError: 7, powerError: 10, weaponLimit: 5 },
  normal: { angleStep: 7, powerStep: 9, angleError: 3.2, powerError: 5, weaponLimit: 8 },
  hard: { angleStep: 4, powerStep: 6, angleError: 1.2, powerError: 2, weaponLimit: 12 },
  master: { angleStep: 2.5, powerStep: 4, angleError: .35, powerError: .7, weaponLimit: 16 }
};

function predictImpact(shooter, angleDegrees, power, weapon) {
  const angle = angleDegrees * Math.PI / 180;
  const speed = (290 + power * 4.35) * weapon.speed;
  const muzzle = muzzlePosition(shooter);
  let x = muzzle.x, y = muzzle.y, vx = Math.cos(angle) * speed * shooter.facing, vy = -Math.sin(angle) * speed;
  for (let step = 0; step < 360; step += 1) {
    const dt = .025; vx += game.wind * 1.45 * weapon.wind * dt; vy += arenaConfig().gravity * weapon.gravity * dt; x += vx * dt; y += vy * dt;
    if (y >= terrainY(Math.max(0, Math.min(W, x))) || x < -80 || x > W + 80) return { x, y };
  }
  return { x, y };
}

function botDestination() {
  const bot = game.players[1];
  if (game.dangerInset && (bot.x < game.dangerInset + 70 || bot.x > W - game.dangerInset - 70)) return W / 2;
  const desiredPickup = game.pickups.find((pickup) => !pickup.taken && ((pickup.type === "health" && bot.hp < game.maxHp * .65) || (pickup.type === "shield" && bot.shield < 10)));
  if (desiredPickup) return desiredPickup.x;
  let best = { x: bot.x, score: Infinity };
  for (let x = Math.max(90, bot.x - 180); x <= Math.min(1190, bot.x + 180); x += 30) {
    const surface = surfaceAt(x); const unsafe = ["lava", "spores", "thinIce"].includes(surface) ? 130 : 0;
    const rangePenalty = Math.abs(Math.abs(x - game.players[0].x) - 520) * .08;
    const score = terrainY(x) + unsafe + rangePenalty;
    if (score < best.score) best = { x, score };
  }
  return best.x;
}

function moveBotTactically() {
  const targetX = botDestination();
  const direction = Math.sign(targetX - game.players[1].x);
  for (let step = 0; step < 22 && direction && Math.abs(targetX - game.players[1].x) > 8; step += 1) if (!applyMovement(1, direction, 6)) break;
}

function chooseBotShot() {
  const level = botLevels[selectedDifficulty] || botLevels.normal;
  const shooter = game.players[1]; const target = game.players[0];
  const usable = Object.keys(weapons).filter((id) => game.ammo[1][id] !== 0 && id !== "isinla").slice(0, level.weaponLimit);
  if (game.dangerInset && (shooter.x < game.dangerInset + 45 || shooter.x > W - game.dangerInset - 45) && game.ammo[1].isinla !== 0) usable.push("isinla");
  let best = { score: Infinity, angle: 45, power: 65, weapon: "findik" };
  for (const weaponId of usable) {
    const weapon = weapons[weaponId]; const targetX = weaponId === "isinla" ? W / 2 : target.x;
    for (let angle = 20; angle <= 78; angle += level.angleStep) for (let power = 25; power <= 100; power += level.powerStep) {
      const hit = predictImpact(shooter, angle, power, weapon);
      let score = Math.abs(hit.x - targetX);
      if (weapon.radius) score = Math.max(0, score - weapon.radius * .35);
      if (weapon.effect && !target.effects[weapon.effect]) score -= 14;
      if (weaponId === "itici" && (target.x < 190 || target.x > 1090)) score -= 25;
      if (Math.abs(hit.x - shooter.x) < weapon.radius + 55 && weaponId !== "isinla") score += 180;
      if (score < best.score) best = { score, angle, power, weapon: weaponId };
    }
  }
  best.angle = Math.max(5, Math.min(85, best.angle + (Math.random() * 2 - 1) * level.angleError));
  best.power = Math.max(15, Math.min(100, best.power + (Math.random() * 2 - 1) * level.powerError));
  return best;
}

function botShot() {
  if (!game || game.gameOver || game.turn !== 1 || game.shotResolving) return;
  moveBotTactically();
  game.players[1].facing = game.players[0].x >= game.players[1].x ? 1 : -1;
  const shot = chooseBotShot();
  beginShot(1, shot);
}

function startNextWave() {
  game.shotResolving = true;
  pulse(`Dalga ${game.wave} temizlendi`);
  window.setTimeout(() => {
    game.wave += 1;
    const bot = game.players[1]; const fighterIds = Object.keys(fighters);
    bot.fighter = fighterIds[(game.wave + game.terrain.seed) % fighterIds.length]; bot.name = `${fighters[bot.fighter].name} · ${game.wave}`;
    bot.hp = Math.min(game.maxHp, 50 + game.wave * 9); bot.shield = Math.min(30, Math.max(0, game.wave - 2) * 5); bot.effects = {}; bot.x = 1075; bot.platformId = null; bot.airborne = false;
    game.players[0].hp = Math.min(game.maxHp, game.players[0].hp + 15);
    for (const id of Object.keys(game.ammo[0])) if (game.ammo[0][id] >= 0) game.ammo[0][id] += 1;
    if (game.wave % 2 === 0) game.pickups.forEach((pickup) => { pickup.taken = false; });
    game.turn = 0; game.turnNumber += 1; game.moveBudget = [160, 160]; game.turnEndsAt = Date.now() + game.rules.turnSeconds * 1000; game.shotResolving = false; game.settleTimer = 0; settlePlayers(); updateHud(); pulse(`Dalga ${game.wave}`);
  }, 900);
}

function finishGame(result) {
  game.gameOver = result;
  game.shotResolving = false;
  updateHud();
  const won = game.roomMode === "team2v2" ? result.winningTeam === game.players[localIndex].team : result.winner === localIndex;
  const victoryCopy = result.reason === "control" ? "Kontrol noktası ele geçirildi!" : result.reason === "weaponRace" ? "Silah yarışını tamamladın!" : game.roomMode === "team2v2" ? "Takımın kazandı!" : "Kazandın!";
  const defeatCopy = result.reason === "control" ? "Kontrol noktasını rakip aldı" : result.reason === "weaponRace" ? "Silah yarışını rakip bitirdi" : "Bu kez rakip kazandı";
  showResult(won ? victoryCopy : defeatCopy, won);
  beep(won ? 520 : 130, .35, won ? "sine" : "triangle");
}

function showResult(title, allowRematch = true) {
  ui.resultTitle.textContent = title;
  ui.rematch.classList.toggle("hidden", !allowRematch);
  ui.result.classList.remove("hidden");
}

function rematch() {
  if (mode === "online") {
    if (localIndex === game.authorityIndex) send("rematch"); else pulse("Oda yöneticisinin tekrar başlatması bekleniyor");
  } else startPractice();
}

function updateHud() {
  if (!game) return;
  const leftIndex = mode === "online" && game.players.length > 2 ? localIndex : 0;
  const rightIndex = mode === "online" && game.players.length > 2 ? (game.turn === localIndex ? nextLivingPlayer(localIndex) : game.turn) : 1;
  const p0 = game.players[leftIndex]; const p1 = game.players[rightIndex];
  ui.p0Name.textContent = p0.name; ui.p1Name.textContent = p1.name;
  ui.p0Hp.textContent = p0.hp; ui.p1Hp.textContent = p1.hp;
  ui.p0Health.style.width = `${p0.hp / game.maxHp * 100}%`; ui.p1Health.style.width = `${p1.hp / game.maxHp * 100}%`;
  ui.wind.textContent = `RÜZGÂR ${game.wind > 0 ? "→" : game.wind < 0 ? "←" : "•"} ${Math.abs(game.wind)}`;
  const soloLabel = practiceRule === "survival" ? `HAYATTA KAL · DALGA ${game.wave}` : `ANTRENMAN · ${selectedDifficulty.toUpperCase()}`;
  const typeNames = { classic: "KLASİK", control: "KONTROL", weaponRace: "SİLAH YARIŞI", chaos: "KAOS" };
  const baseOnlineLabel = game.roomMode === "team2v2" ? `2V2 · ODA ${room}` : game.roomMode === "ffa4" ? `HERKES TEK · ODA ${room}` : `1V1 · ODA ${room}`;
  const onlineLabel = `${typeNames[game.rules.gameType] || "KLASİK"} · ${baseOnlineLabel}`;
  ui.mode.textContent = `${mode === "online" ? onlineLabel : soloLabel} · TUR ${game.turnNumber}`;
  if (game.gameOver) ui.turn.textContent = "MAÇ BİTTİ";
  else if (game.shotResolving) ui.turn.textContent = "HAVADA…";
  else ui.turn.textContent = game.turn === localIndex ? "SENİN SIRAN" : `${game.players[game.turn].name} OYNUYOR`;
  if (game.rules.gameType === "control") ui.wind.textContent += ` · PUAN ${game.objective.scores.join("-")}/${game.objective.target}`;
  if (game.rules.gameType === "weaponRace") ui.wind.textContent += ` · SİLAH ${Math.min(game.raceWeapons.length, game.weaponProgress[localIndex] + 1)}/${game.raceWeapons.length}`;
  if (game.rules.gameType === "chaos") ui.wind.textContent += ` · ${({ lowGravity: "DÜŞÜK ÇEKİM", superWind: "FIRTINA", megaBlast: "DEV PATLAMA", bouncy: "SEKME", noGuides: "KÖR ATIŞ" })[game.chaosModifier] || "KAOS"}`;
  ui.fire.disabled = !canShoot();
  updateMoveControls();
  const effectInfo = { burn: ["🔥 YANMA", "#ff784c"], freeze: ["❄ DONMA", "#72ddff"], poison: ["☠ ZEHİR", "#79ed53"], stun: ["⚡ ŞAŞKIN", "#ffe06a"] };
  [[ui.p0Status, p0], [ui.p1Status, p1]].forEach(([container, player]) => { container.innerHTML = Object.entries(player.effects).map(([id, turns]) => effectInfo[id] ? `<span class="status-chip" style="color:${effectInfo[id][1]}">${effectInfo[id][0]} ${turns}</span>` : "").join(""); });
  renderOnlineRoster();
  document.querySelectorAll(".weapon").forEach((button) => {
    const amount = game.ammo[localIndex][button.dataset.weapon];
    const forced = game.rules.gameType === "weaponRace" ? game.raceWeapons[game.weaponProgress[localIndex]] : null;
    button.dataset.ammo = amount < 0 ? "∞" : String(amount);
    button.classList.toggle("empty", amount === 0 || Boolean(forced && forced !== button.dataset.weapon));
    button.disabled = amount === 0 || Boolean(forced && forced !== button.dataset.weapon);
  });
}

function updateMoveControls() {
  if (!game) return;
  ui.moveEnergy.textContent = `HAREKET ${Math.ceil(game.moveBudget[localIndex] || 0)}`;
  ui.moveLeft.disabled = !canMove(); ui.moveRight.disabled = !canMove();
  ui.jump.disabled = !canMove() || game.players[localIndex].airborne || game.moveBudget[localIndex] < 28;
}

function renderOnlineRoster() {
  if (mode !== "online" || game.players.length < 3) { ui.onlineRoster.classList.add("hidden"); return; }
  ui.onlineRoster.classList.remove("hidden");
  if (ui.onlineRoster.children.length !== game.players.length) {
    ui.onlineRoster.replaceChildren();
    game.players.forEach(() => {
      const card = document.createElement("div");
      const header = document.createElement("header");
      header.append(document.createElement("span"), document.createElement("b"));
      card.append(header, document.createElement("i")); ui.onlineRoster.append(card);
    });
  }
  game.players.forEach((player, index) => {
    const teamClass = game.roomMode === "team2v2" ? (player.team === 0 ? " team-a" : " team-b") : "";
    const card = ui.onlineRoster.children[index];
    card.className = `roster-player${teamClass}${index === game.turn ? " active" : ""}${index === localIndex ? " me" : ""}${player.hp <= 0 ? " dead" : ""}`;
    card.style.setProperty("--hp", `${player.hp / game.maxHp * 100}%`); card.style.setProperty("--color", game.roomMode === "team2v2" ? (player.team === 0 ? "#ffb347" : "#55d9ff") : player.color);
    card.firstElementChild.children[0].textContent = `${game.roomMode === "team2v2" ? (player.team === 0 ? "A" : "B") : index + 1}. ${player.name}`;
    card.firstElementChild.children[1].textContent = player.hp > 0 ? String(player.hp) : "ELENDİ";
  });
}

function pulse(text) {
  const old = ui.turn.textContent;
  ui.turn.textContent = text.toUpperCase();
  window.setTimeout(() => { if (ui.turn.textContent === text.toUpperCase()) ui.turn.textContent = old; }, 1400);
}

function update(dt) {
  if (!game) return;
  if (!game.gameOver && !game.shotResolving && game.turnEndsAt) {
    const seconds = Math.max(0, Math.ceil((game.turnEndsAt - Date.now()) / 1000));
    if (seconds !== game.lastTimer) { game.lastTimer = seconds; ui.timer.textContent = seconds; ui.timer.classList.toggle("danger", seconds <= 5); }
    if (mode === "practice" && seconds === 0) {
      charge.active = false; ui.fire.classList.remove("charging"); ui.fireHint.textContent = "BASILI TUT";
      game.turn = 1 - game.turn; game.turnNumber += 1; if (game.rules.suddenDeathTurn > 0 && game.turnNumber > game.rules.suddenDeathTurn) game.dangerInset = Math.min(430, game.dangerInset + 28); applyTurnEffects(game.turn); game.moveBudget[game.turn] = 160; game.turnEndsAt = Date.now() + game.rules.turnSeconds * 1000; updateHud();
      if (game.turn === 1) window.setTimeout(botShot, 450);
    }
  }
  game.shake = Math.max(0, game.shake - dt * 28);
  game.flash = Math.max(0, game.flash - dt * 1.8);
  for (const player of game.players) {
    player.recoil = Math.max(0, (player.recoil || 0) - dt * 5.8);
    player.weaponSwap = Math.max(0, (player.weaponSwap || 0) - dt * 4.2);
    player.muzzleFlash = Math.max(0, (player.muzzleFlash || 0) - dt * 9);
    player.walk = Math.max(0, (player.walk || 0) - dt * 4.5);
    if (player.airborne) {
      player.vy += arenaConfig().gravity * .82 * dt;
      player.y += player.vy * dt;
      let floor = terrainY(player.x) - 29; let landingPlatform = null;
      for (const platform of game.platforms) if (platform.hp > 0 && Math.abs(player.x - platform.x) <= platform.width / 2 && player.y <= platform.y && platform.y - 29 < floor) { floor = platform.y - 29; landingPlatform = platform; }
      if (player.y >= floor && player.vy > 0) { player.y = floor; player.vy = 0; player.airborne = false; player.platformId = landingPlatform?.id ?? null; player.walk = 1; for (let i = 0; i < 6; i += 1) emitParticle({ x: player.x + (Math.random() - .5) * 30, y: floor + 25, vx: (Math.random() - .5) * 45, vy: -20 - Math.random() * 35, life: .3, size: 2 + Math.random() * 3, color: "rgba(220,205,165,.65)" }); }
    }
  }
  if (charge.active) {
    if (!canShoot()) releaseCharge();
    else {
      let power = Number(ui.power.value) + charge.direction * 72 * dt;
      if (power >= 100) { power = 100; charge.direction = -1; }
      if (power <= 15) { power = 15; charge.direction = 1; }
      ui.power.value = power; ui.power.dispatchEvent(new Event("input"));
    }
  }
  const moveDirection = movement.left === movement.right ? 0 : movement.left ? -1 : 1;
  if (moveDirection && canMove()) {
    if (mode === "online") {
      movement.netTimer += dt;
      if (movement.netTimer >= .08) { const elapsed = movement.netTimer; movement.netTimer = 0; requestNetworkMove(moveDirection, 105 * elapsed); }
    } else applyMovement(localIndex, moveDirection, 105 * dt);
  } else movement.netTimer = 0;
  for (const pickup of game.pickups) {
    if (pickup.taken) continue;
    const collector = game.players.findIndex((player) => !player.airborne && Math.abs(player.x - pickup.x) < 34);
    if (collector < 0) continue;
    pickup.taken = true;
    const player = game.players[collector];
    if (pickup.type === "health") player.hp = Math.min(game.maxHp, player.hp + 25);
    if (pickup.type === "shield") player.shield = Math.min(40, player.shield + 30);
    if (pickup.type === "ammo") for (const id of Object.keys(game.ammo[collector])) if (game.ammo[collector][id] >= 0) game.ammo[collector][id] += id === "meteor" ? 1 : 2;
    game.damageNumbers.push({ x: pickup.x, y: terrainY(pickup.x) - 70, value: pickup.type === "health" ? "+25 CAN" : pickup.type === "shield" ? "+30 KALKAN" : "+MÜHİMMAT", positive: true, life: 1.5, color: "#8dffe5" });
    beep(640, .16, "sine"); updateHud();
  }
  for (const cloud of game.clouds) { cloud.x += cloud.speed * dt + game.wind * .012; if (cloud.x > W + cloud.size * 2) cloud.x = -cloud.size * 2; }
  for (let i = game.projectiles.length - 1; i >= 0; i -= 1) {
    const p = game.projectiles[i];
    p.age += dt; p.vx += game.wind * 1.45 * p.wind * dt; p.vy += arenaConfig().gravity * p.gravity * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.trail.length === 0 || Math.hypot(p.x - p.trail[0].x, p.y - p.trail[0].y) > 8) p.trail.unshift({ x: p.x, y: p.y, life: 1 });
    p.trail.forEach((point) => { point.life -= dt * 1.8; });
    p.trail = p.trail.filter((point) => point.life > 0).slice(0, performanceProfile.maxTrail);
    const ground = terrainY(Math.max(0, Math.min(W, p.x)));
    const groundHit = p.y >= ground;
    const platformHit = game.platforms.find((platform) => platform.hp > 0 && Math.abs(p.x - platform.x) <= platform.width / 2 && Math.abs(p.y - platform.y) < 12);
    let playerHit = false;
    for (const player of game.players) {
      if (p.age < .22 && player === game.players[p.owner]) continue;
      if (Math.hypot(p.x - player.x, p.y - (player.y - 88)) < 46) playerHit = true;
    }
    if (platformHit) { platformHit.hp -= 1; p.y = platformHit.y; impact(p); game.projectiles.splice(i, 1); if (platformHit.hp <= 0) settlePlayers(); }
    else if ((groundHit || playerHit) && p.special === "mine") { game.mines.push({ ...p, x: p.x, y: ground - 9, armedAt: performance.now() + 700 }); game.projectiles.splice(i, 1); beep(180, .08, "square"); }
    else if ((groundHit || playerHit) && p.special === "sticky") { game.stickyBombs.push({ ...p, y: Math.min(p.y, ground - 5), timer: 1.35 }); game.projectiles.splice(i, 1); beep(240, .08, "square"); }
    else if (groundHit && p.bounces > 0) { p.y = ground - 5; p.vy = -Math.abs(p.vy) * .58; p.vx *= .76; p.bounces -= 1; beep(155, .06, "triangle"); }
    else if (groundHit || playerHit) { impact(p); game.projectiles.splice(i, 1); }
    else if (p.x < -100 || p.x > W + 100 || p.y > H + 100) game.projectiles.splice(i, 1);
  }
  for (let i = game.stickyBombs.length - 1; i >= 0; i -= 1) { const bomb = game.stickyBombs[i]; bomb.timer -= dt; if (bomb.timer <= 0) { impact(bomb); game.stickyBombs.splice(i, 1); } }
  for (let i = game.mines.length - 1; i >= 0; i -= 1) { const mine = game.mines[i]; if (performance.now() >= mine.armedAt && game.players.some((player, index) => index !== mine.owner && Math.abs(player.x - mine.x) < 72)) { game.shotResolving = true; game.settleTimer = 0; impact(mine); game.mines.splice(i, 1); } }
  for (let i = game.particles.length - 1; i >= 0; i -= 1) {
    const p = game.particles[i]; p.life -= dt; p.vy += 270 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.life <= 0) { particlePool.push(p); game.particles.splice(i, 1); }
  }
  while (game.particles.length > performanceProfile.maxParticles) particlePool.push(game.particles.shift());
  for (let i = game.explosions.length - 1; i >= 0; i -= 1) { game.explosions[i].life -= dt * 2.2; if (game.explosions[i].life <= 0) game.explosions.splice(i, 1); }
  for (let i = game.damageNumbers.length - 1; i >= 0; i -= 1) { const number = game.damageNumbers[i]; number.life -= dt * .85; number.y -= dt * 38; if (number.life <= 0) game.damageNumbers.splice(i, 1); }
  if (game.shotResolving && !game.awaitingSync && game.projectiles.length === 0 && game.stickyBombs.length === 0) {
    game.settleTimer += dt;
    if (game.settleTimer > .65) finishShot();
  }
}

function drawCloud(cloud) {
  ctx.save(); ctx.globalAlpha = .72; ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(cloud.x, cloud.y, cloud.size * .42, 0, Math.PI * 2); ctx.arc(cloud.x + cloud.size * .44, cloud.y + 5, cloud.size * .31, 0, Math.PI * 2); ctx.arc(cloud.x - cloud.size * .42, cloud.y + 9, cloud.size * .28, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

function paintTerrain(target) {
  const arena = arenaConfig();
  target.clearRect(0, 0, W, H);
  const gradient = target.createLinearGradient(0, 470, 0, H);
  gradient.addColorStop(0, arena.ground[0]); gradient.addColorStop(.12, arena.ground[1]); gradient.addColorStop(1, arena.ground[2]);
  target.beginPath(); target.moveTo(0, terrainY(0));
  for (let x = 0; x <= W; x += 6) target.lineTo(x, terrainY(x));
  target.lineTo(W, H); target.lineTo(0, H); target.closePath(); target.fillStyle = gradient; target.fill();
  target.beginPath(); target.moveTo(0, terrainY(0)); for (let x = 0; x <= W; x += 5) target.lineTo(x, terrainY(x));
  target.strokeStyle = arena.top; target.lineWidth = 10; target.stroke();
  target.beginPath(); target.moveTo(0, terrainY(0) + 9); for (let x = 0; x <= W; x += 5) target.lineTo(x, terrainY(x) + 9);
  target.strokeStyle = "rgba(23,50,39,.72)"; target.lineWidth = 8; target.stroke();
  target.save(); target.globalAlpha = .22; target.fillStyle = "#96d176";
  for (let x = 18; x < W; x += 37) { const y = terrainY(x); target.beginPath(); target.ellipse(x, y + 20 + (x % 17), 2.5, 1.2, -.3, 0, Math.PI * 2); target.fill(); }
  target.restore();
}

function drawTerrain() {
  const terrain = game.terrain;
  if (!terrain.layer) {
    terrain.layer = typeof OffscreenCanvas === "function" ? new OffscreenCanvas(W, H) : Object.assign(document.createElement("canvas"), { width: W, height: H });
    terrain.layerDirty = true;
  }
  if (terrain.layerDirty) { paintTerrain(terrain.layer.getContext("2d")); terrain.layerDirty = false; }
  ctx.drawImage(terrain.layer, 0, 0);
}

function drawHazards() {
  const zoneSets = {
    sunset: [[315, 455, "mud", "ÇAMUR"], [575, 705, "lava", "LAV"]],
    mushroom: [[515, 695, "water", "SU"], [790, 900, "spores", "SPOR"]],
    aurora: [[335, 520, "ice", "BUZ"], [720, 845, "thinIce", "İNCE BUZ"]]
  };
  const colors = { mud: "#8b603c", lava: "#ff5938", water: "#4acfff", spores: "#a2ff5d", ice: "#9deaff", thinIce: "#d5fbff" };
  for (const platform of game.platforms) {
    if (platform.hp <= 0) continue;
    const platformColor = game.arena === "aurora" ? "#a9efff" : game.arena === "mushroom" ? "#7bedca" : "#dba255";
    ctx.save(); ctx.fillStyle = "rgba(17,28,43,.92)"; ctx.strokeStyle = platformColor; ctx.lineWidth = 6; ctx.shadowBlur = 16; ctx.shadowColor = platformColor; ctx.beginPath(); ctx.roundRect(platform.x - platform.width / 2, platform.y, platform.width, 18, 8); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0; ctx.fillStyle = platformColor; for (let x = platform.x - platform.width / 2 + 18; x < platform.x + platform.width / 2; x += 31) ctx.fillRect(x, platform.y + 5, 13, 3); ctx.restore();
  }
  for (const [start, end, type, label] of zoneSets[game.arena]) {
    ctx.save(); ctx.strokeStyle = colors[type]; ctx.lineWidth = type === "lava" ? 16 : 11; ctx.shadowBlur = type === "lava" || type === "spores" ? 22 : 10; ctx.shadowColor = colors[type]; ctx.beginPath();
    for (let x = start; x <= end; x += 5) { const y = terrainY(x) + 2; if (x === start) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
    ctx.shadowBlur = 0; ctx.fillStyle = colors[type]; ctx.globalAlpha = .88; ctx.font = "900 9px Sora"; ctx.textAlign = "center"; ctx.fillText(label, (start + end) / 2, terrainY((start + end) / 2) + 29); ctx.restore();
  }
  for (const barrel of game.barrels) {
    if (barrel.destroyed) continue;
    const y = terrainY(barrel.x) - 24;
    ctx.save(); ctx.translate(barrel.x, y); ctx.fillStyle = "#8e3e2d"; ctx.strokeStyle = "#ffb34c"; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(-18, -27, 36, 54, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#ffc956"; ctx.font = "900 20px Sora"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("!", 0, 1); ctx.restore();
  }
  if (game.dangerInset > 0) {
    const pulse = .18 + Math.abs(Math.sin(performance.now() * .004)) * .12;
    ctx.fillStyle = `rgba(255,45,55,${pulse})`; ctx.fillRect(0, 0, game.dangerInset, H); ctx.fillRect(W - game.dangerInset, 0, game.dangerInset, H);
    ctx.strokeStyle = "rgba(255,105,80,.9)"; ctx.lineWidth = 5; ctx.setLineDash([15, 10]); ctx.beginPath(); ctx.moveTo(game.dangerInset, 0); ctx.lineTo(game.dangerInset, H); ctx.moveTo(W - game.dangerInset, 0); ctx.lineTo(W - game.dangerInset, H); ctx.stroke(); ctx.setLineDash([]);
  }
}

function drawPickups() {
  const colors = { health: "#ff625d", ammo: "#ffc44d", shield: "#63e7ff" };
  const icons = { health: "+", ammo: "✦", shield: "◆" };
  for (const pickup of game.pickups) {
    if (pickup.taken) continue;
    const y = terrainY(pickup.x) - 25 + Math.sin(performance.now() * .003 + pickup.bob) * 5;
    ctx.save(); ctx.translate(pickup.x, y); ctx.shadowBlur = 22; ctx.shadowColor = colors[pickup.type];
    ctx.fillStyle = "#17213a"; ctx.strokeStyle = colors[pickup.type]; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(-21, -18, 42, 36, 8); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0; ctx.fillStyle = colors[pickup.type]; ctx.font = "900 20px Sora"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(icons[pickup.type], 0, 1); ctx.restore();
  }
}

function drawObjective() {
  if (game.rules.gameType !== "control") return;
  const x = game.objective.x; const y = terrainY(x); const pulse = 1 + Math.sin(performance.now() * .004) * .08;
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = "rgba(255,218,87,.9)"; ctx.fillStyle = "rgba(255,200,55,.12)"; ctx.lineWidth = 5; ctx.shadowBlur = 24; ctx.shadowColor = "#ffd55a"; ctx.beginPath(); ctx.ellipse(0, 4, game.objective.radius * pulse, 24 * pulse, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0; ctx.strokeStyle = "#fff0a1"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(0, -105); ctx.stroke(); ctx.fillStyle = "#ffc44d"; ctx.beginPath(); ctx.moveTo(3, -102); ctx.lineTo(55, -82); ctx.lineTo(3, -61); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.font = "900 11px Sora"; ctx.textAlign = "center"; ctx.fillText("KONTROL NOKTASI", 0, 39); ctx.restore();
}

function drawAmmo(weaponId, x, y, width, rotation = 0) {
  const weapon = weapons[weaponId] || weapons.findik;
  const height = width * .58;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rotation);
  const sheet = weapon.atlas === "tactical" ? art.tacticalAmmo : art.ammo;
  if (sheet.complete && sheet.naturalWidth) {
    const sw = sheet.naturalWidth / 4, sh = sheet.naturalHeight / 2;
    ctx.drawImage(sheet, weapon.col * sw, weapon.row * sh, sw, sh, -width / 2, -height / 2, width, height);
  } else {
    ctx.fillStyle = weapon.color; ctx.beginPath(); ctx.ellipse(0, 0, width * .34, height * .28, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawPlayer(player, index) {
  const active = game.turn === index && !game.shotResolving;
  const phase = performance.now() * .0035 + index * 1.7;
  const breathing = Math.sin(phase);
  const walkBob = Math.abs(Math.sin(player.walkPhase || 0)) * (player.walk || 0) * 5;
  const bob = breathing * (active ? 3 : 1.4) - walkBob;
  const recoil = (player.recoil || 0) ** 2;
  const kickX = -player.facing * recoil * 13;
  const kickY = recoil * 3;
  const floor = terrainY(player.x);
  const ground = player.y + 29;
  ctx.save();
  const airHeight = Math.max(0, floor - ground);
  ctx.globalAlpha = Math.max(.18, 1 - airHeight / 260); ctx.fillStyle = "rgba(2,6,12,.5)"; ctx.beginPath(); ctx.ellipse(player.x - kickX * .2, floor + 5, 70 - recoil * 7 - airHeight * .08, 13 - recoil * 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  if (active) { const glow = ctx.createRadialGradient(player.x, ground - 80, 10, player.x, ground - 80, 110); glow.addColorStop(0, index === 0 ? "rgba(255,190,73,.2)" : "rgba(84,226,195,.2)"); glow.addColorStop(1, "transparent"); ctx.fillStyle = glow; ctx.fillRect(player.x - 120, ground - 205, 240, 220); }
  if (game.roomMode === "team2v2") { ctx.strokeStyle = player.team === 0 ? "rgba(255,179,71,.9)" : "rgba(85,217,255,.9)"; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(player.x, floor + 4, 68, 12, 0, 0, Math.PI * 2); ctx.stroke(); }
  if (player.shield > 0) { ctx.fillStyle = "rgba(95,225,255,.09)"; ctx.strokeStyle = `rgba(105,235,255,${.35 + player.shield / 90})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(player.x, ground - 118, 92, 135, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  if (player.effects.burn) { ctx.fillStyle = "rgba(255,90,30,.72)"; for (let i = 0; i < 4; i += 1) { ctx.beginPath(); ctx.arc(player.x - 34 + i * 22, ground - 18 - Math.abs(Math.sin(phase + i)) * 18, 7, 0, Math.PI * 2); ctx.fill(); } }
  if (player.effects.poison) { ctx.fillStyle = "rgba(105,245,70,.6)"; for (let i = 0; i < 4; i += 1) { ctx.beginPath(); ctx.arc(player.x - 40 + i * 25, ground - 45 - Math.abs(Math.sin(phase * 1.4 + i)) * 55, 4 + i % 2, 0, Math.PI * 2); ctx.fill(); } }
  if (player.effects.freeze) { ctx.strokeStyle = "rgba(105,225,255,.75)"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(player.x, ground - 94, 67, .15, Math.PI - .15); ctx.stroke(); }
  const fighter = fighters[player.fighter] || fighters.fox;
  const sheet = art[fighter.sheet];
  const heldX = player.x + player.facing * (fighter.anchorX + 22);
  const heldY = ground + fighter.anchorY + bob * .7;
  const heldRotation = player.facing === 1 ? -.07 + breathing * .012 : Math.PI + .07 - breathing * .012;
  ctx.save();
  ctx.translate(kickX, kickY);
  const swapScale = 1 + (player.weaponSwap || 0) * .16;
  drawAmmo(player.equipped || "findik", heldX, heldY, 92 * swapScale, heldRotation);
  if (sheet.complete && sheet.naturalWidth) {
    const sw = sheet.naturalWidth / fighter.cols, sh = sheet.naturalHeight / fighter.rows;
    const flip = fighter.nativeFacing !== player.facing;
    ctx.save(); ctx.translate(player.x, 0); ctx.scale(flip ? -1 : 1, 1);
    ctx.drawImage(sheet, fighter.col * sw, fighter.row * sh, sw, sh, -103, ground - 270 + bob, 206, 270);
    ctx.restore();
  } else {
    ctx.fillStyle = player.color; ctx.beginPath(); ctx.arc(player.x, ground - 55, 46, 0, Math.PI * 2); ctx.fill();
  }
  const socketX = player.x + player.facing * fighter.anchorX;
  ctx.save(); ctx.translate(socketX, heldY); ctx.rotate(heldRotation); ctx.fillStyle = "#e4a93f"; ctx.strokeStyle = "#5f351b"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, 7, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
  if (player.muzzleFlash > 0) {
    const muzzle = muzzlePosition(player);
    const flash = ctx.createRadialGradient(muzzle.x, muzzle.y, 1, muzzle.x, muzzle.y, 34 * player.muzzleFlash);
    flash.addColorStop(0, "rgba(255,255,225,1)"); flash.addColorStop(.35, "rgba(255,205,74,.9)"); flash.addColorStop(1, "rgba(255,92,42,0)");
    ctx.fillStyle = flash; ctx.beginPath(); ctx.arc(muzzle.x, muzzle.y, 36 * player.muzzleFlash, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  ctx.restore();
}

function drawAimGuide() {
  if (!canShoot() || game.chaosModifier === "noGuides") return;
  const player = game.players[game.turn];
  const angle = Number(ui.angle.value) * Math.PI / 180;
  const weapon = weapons[selectedWeapon];
  const speed = (290 + Number(ui.power.value) * 4.35) * weapon.speed;
  const muzzle = muzzlePosition(player);
  let x = muzzle.x, y = muzzle.y, vx = Math.cos(angle) * speed * player.facing, vy = -Math.sin(angle) * speed;
  ctx.save(); ctx.fillStyle = "rgba(255,255,255,.72)";
  for (let i = 0; i < 11; i += 1) {
    const dt = .08; vx += game.wind * 1.45 * weapon.wind * dt; vy += arenaConfig().gravity * weapon.gravity * dt; x += vx * dt; y += vy * dt;
    ctx.globalAlpha = 1 - i / 13; ctx.beginPath(); ctx.arc(x, y, Math.max(2, 5 - i * .22), 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function render() {
  ctx.save();
  if (game?.shake) ctx.translate((Math.random() - .5) * game.shake, (Math.random() - .5) * game.shake);
  const background = art.arenas[game?.arena || selectedArena];
  if (background?.complete && background.naturalWidth) ctx.drawImage(background, 0, 0, W, H);
  else { const sky = ctx.createLinearGradient(0,0,0,H); sky.addColorStop(0,"#10244b"); sky.addColorStop(1,"#ef8758"); ctx.fillStyle=sky; ctx.fillRect(0,0,W,H); }
  ctx.fillStyle = "rgba(6,10,25,.08)"; ctx.fillRect(0,0,W,H);
  if (!game) { ctx.restore(); return; }
  drawTerrain();
  drawHazards();
  drawObjective();
  drawPickups();
  for (const mine of game.mines) drawAmmo("mayin", mine.x, mine.y, 48, 0);
  for (const bomb of game.stickyBombs) { drawAmmo("yapiskan", bomb.x, bomb.y, 50, 0); ctx.fillStyle = "#ff6b55"; ctx.font = "900 13px Sora"; ctx.textAlign = "center"; ctx.fillText(Math.max(0, bomb.timer).toFixed(1), bomb.x, bomb.y - 31); }
  drawAimGuide();
  game.players.forEach(drawPlayer);
  for (const p of game.projectiles) {
    p.trail.slice().reverse().forEach((point, index) => { ctx.globalAlpha = point.life * .55; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(point.x, point.y, 2 + index * .18, 0, Math.PI * 2); ctx.fill(); });
    ctx.globalAlpha = 1; ctx.shadowBlur = 24; ctx.shadowColor = p.color; drawAmmo(p.weapon, p.x, p.y, 54, Math.atan2(p.vy, p.vx)); ctx.shadowBlur = 0;
  }
  for (const explosion of game.explosions) { ctx.globalAlpha = explosion.life; ctx.strokeStyle = explosion.color; ctx.lineWidth = 5 * explosion.life; ctx.beginPath(); ctx.arc(explosion.x, explosion.y, explosion.radius * (1.3 - explosion.life), 0, Math.PI * 2); ctx.stroke(); }
  for (const p of game.particles) { ctx.globalAlpha = Math.min(1,p.life*2); ctx.fillStyle=p.color; ctx.shadowBlur=performanceProfile.shadows ? 8 : 0; ctx.shadowColor=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.size||3,0,Math.PI*2); ctx.fill(); } ctx.shadowBlur=0;
  for (const number of game.damageNumbers) { const label = number.positive ? number.value : `-${number.value}`; ctx.globalAlpha=Math.min(1,number.life*2); ctx.fillStyle=number.color; ctx.strokeStyle="rgba(8,10,22,.75)"; ctx.lineWidth=7; ctx.font="800 34px Sora"; ctx.textAlign="center"; ctx.strokeText(label,number.x,number.y); ctx.fillText(label,number.x,number.y); }
  ctx.globalAlpha = 1;
  if (game.flash > 0) { ctx.fillStyle=`rgba(255,240,190,${game.flash})`; ctx.fillRect(0,0,W,H); }
  ctx.restore();
}

function loop(now) {
  if (screen !== "game" || document.hidden) { lastTime = now; accumulator = 0; requestAnimationFrame(loop); return; }
  const elapsed = Math.min(.1, (now - lastTime) / 1000); lastTime = now; accumulator += elapsed;
  while (accumulator >= performanceProfile.physicsStep) { update(performanceProfile.physicsStep); accumulator -= performanceProfile.physicsStep; }
  if (now - lastRender >= performanceProfile.frameInterval) { lastRender = now; render(); }
  requestAnimationFrame(loop);
}

function beep(frequency, duration, type) {
  if (!soundEnabled) return;
  try {
    audioContext ||= new AudioContext();
    const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain();
    oscillator.type = type; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(.08, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(audioContext.destination); oscillator.start(); oscillator.stop(audioContext.currentTime + duration);
  } catch { /* Ses destegi zorunlu degil. */ }
}

$("#practiceButton").addEventListener("click", startPractice);
$("#createButton").addEventListener("click", createRoom);
$("#joinButton").addEventListener("click", joinRoom);
$("#cancelLobby").addEventListener("click", () => { closeSocket(); showScreen("menu"); });
$("#menuButton").addEventListener("click", () => { closeSocket(); ui.result.classList.add("hidden"); showScreen("menu"); });
ui.rematch.addEventListener("click", rematch);
ui.fire.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  ui.fire.setPointerCapture?.(event.pointerId);
  startCharge();
});
ui.fire.addEventListener("pointerup", releaseCharge);
ui.fire.addEventListener("pointercancel", releaseCharge);
ui.fire.addEventListener("lostpointercapture", releaseCharge);
ui.jump.addEventListener("click", requestJump);
ui.angle.addEventListener("input", () => { ui.angleValue.textContent = `${ui.angle.value}°`; });
ui.power.addEventListener("input", () => { ui.powerValue.textContent = ui.power.value; });
ui.roomInput.addEventListener("input", () => { ui.roomInput.value = ui.roomInput.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); });
ui.roomInput.addEventListener("keydown", (event) => { if (event.key === "Enter") joinRoom(); });
ui.roomCode.addEventListener("click", async () => { try { await navigator.clipboard.writeText(room); ui.copyHint.textContent = "Kod kopyalandı!"; } catch { ui.copyHint.textContent = room; } });
$("#soundButton").addEventListener("click", (event) => { soundEnabled = !soundEnabled; event.currentTarget.textContent = soundEnabled ? "♪" : "×"; });

const ruleDescriptions = {
  classic: "Klasik: Son ayakta kalan oyuncu veya takım maçı kazanır.",
  control: "Kontrol: Merkez bölgesinde turunu bitir, 3 puana ilk ulaşan kazanır.",
  weaponRace: "Silah Yarışı: İsabet ettikçe sıradaki silaha geç. Düşenler yeniden doğar; sekiz silahı ilk tamamlayan kazanır.",
  chaos: "Kaos: Her tur çekim, rüzgâr, patlama, sekme veya nişan kuralı değişir."
};
ui.ruleType.addEventListener("change", () => { ui.ruleDescription.textContent = ruleDescriptions[ui.ruleType.value]; });

document.querySelectorAll(".fighter-choice").forEach((button) => button.addEventListener("click", () => {
  selectedFighter = button.dataset.fighter;
  ui.fighterName.textContent = fighters[selectedFighter].name;
  document.querySelectorAll(".fighter-choice").forEach((item) => item.classList.toggle("selected", item === button));
}));

document.querySelectorAll(".arena-choice").forEach((button) => button.addEventListener("click", () => {
  selectedArena = button.dataset.arena;
  ui.arenaName.textContent = arenas[selectedArena].name;
  document.querySelectorAll(".arena-choice").forEach((item) => item.classList.toggle("selected", item === button));
  const backdrop = document.querySelector(".hero-backdrop");
  backdrop.src = art.arenas[selectedArena].src;
  document.querySelector(".arena-tag strong").textContent = arenas[selectedArena].name;
}));

document.querySelectorAll(".weapon").forEach((button) => button.addEventListener("click", () => {
  selectedWeapon = button.dataset.weapon;
  if (game && game.players[localIndex] && !game.shotResolving) { game.players[localIndex].equipped = selectedWeapon; game.players[localIndex].weaponSwap = 1; }
  document.querySelectorAll(".weapon").forEach((item) => item.classList.toggle("selected", item === button));
}));

window.addEventListener("keydown", (event) => {
  if (screen !== "game" || ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
  if (event.key.toLowerCase() === "a" || event.key.toLowerCase() === "d") { movement[event.key.toLowerCase() === "a" ? "left" : "right"] = true; event.preventDefault(); }
  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    ui.angle.value = Math.max(5, Math.min(85, Number(ui.angle.value) + (event.key === "ArrowUp" ? 2 : -2))); ui.angle.dispatchEvent(new Event("input")); event.preventDefault();
  }
  if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
    ui.power.value = Math.max(15, Math.min(100, Number(ui.power.value) + (event.key === "ArrowRight" ? 3 : -3))); ui.power.dispatchEvent(new Event("input")); event.preventDefault();
  }
  if (event.key.toLowerCase() === "w" && !event.repeat) { requestJump(); event.preventDefault(); }
  if (event.code === "Space") { if (!event.repeat) startCharge(); event.preventDefault(); }
});

window.addEventListener("keyup", (event) => {
  if (event.key.toLowerCase() === "a") movement.left = false;
  if (event.key.toLowerCase() === "d") movement.right = false;
  if (event.code === "Space") { releaseCharge(); event.preventDefault(); }
});
window.addEventListener("blur", () => {
  movement.left = false; movement.right = false;
  charge.active = false;
  ui.fire.classList.remove("charging");
  ui.fireHint.textContent = "BASILI TUT";
});
document.addEventListener("visibilitychange", () => { lastTime = performance.now(); accumulator = 0; });

function bindMoveButton(button, key) {
  const stop = () => { movement[key] = false; button.classList.remove("active"); };
  button.addEventListener("pointerdown", (event) => { event.preventDefault(); movement[key] = true; button.classList.add("active"); button.setPointerCapture?.(event.pointerId); });
  button.addEventListener("pointerup", stop); button.addEventListener("pointercancel", stop); button.addEventListener("lostpointercapture", stop);
}
bindMoveButton(ui.moveLeft, "left");
bindMoveButton(ui.moveRight, "right");

function aimFromPointer(event) {
  if (!canShoot()) return;
  const rect = canvas.getBoundingClientRect(); const x = (event.clientX - rect.left) * W / rect.width; const y = (event.clientY - rect.top) * H / rect.height;
  const player = game.players[game.turn]; player.facing = x >= player.x ? 1 : -1; const dx = Math.max(1, Math.abs(x - player.x)); const dy = player.y - y;
  ui.angle.value = Math.max(5, Math.min(85, Math.round(Math.atan2(dy, dx) * 180 / Math.PI)));
  ui.angle.dispatchEvent(new Event("input"));
}

canvas.addEventListener("pointermove", aimFromPointer);
canvas.addEventListener("pointerdown", (event) => {
  if (!canShoot()) return;
  event.preventDefault();
  aimFromPointer(event);
  canvas.setPointerCapture?.(event.pointerId);
  startCharge();
});
canvas.addEventListener("pointerup", (event) => { aimFromPointer(event); releaseCharge(); });
canvas.addEventListener("pointercancel", releaseCharge);
canvas.addEventListener("lostpointercapture", releaseCharge);

requestAnimationFrame(loop);

// Görsel regresyon testi ve hızlı yerel kontrol için: /?practice=1
const debugParams = new URLSearchParams(location.search);
if (debugParams.get("rules") === "1") document.querySelector(".rule-settings").open = true;
if (debugParams.get("practice") === "1") {
  if (fighters[debugParams.get("fighter")]) selectedFighter = debugParams.get("fighter");
  if (arenas[debugParams.get("arena")]) selectedArena = debugParams.get("arena");
  if (weapons[debugParams.get("weapon")]) selectedWeapon = debugParams.get("weapon");
  if (["duel", "survival"].includes(debugParams.get("mode"))) ui.practiceMode.value = debugParams.get("mode");
  if (botLevels[debugParams.get("difficulty")]) ui.botDifficulty.value = debugParams.get("difficulty");
  startPractice();
  if (debugParams.get("players") === "4") {
    mode = "online"; room = "DEBUG"; localIndex = 0; selectedOnlineMode = "ffa4";
    newGame(424242, [
      { name: "Cesur Pati", fighter: selectedFighter, team: 0 }, { name: "Mavi Usta", fighter: "raccoon", team: 1 },
      { name: "Gece Gözcüsü", fighter: "owl", team: 0 }, { name: "Orman Gücü", fighter: "bear", team: 1 }
    ], 2, selectedArena); showScreen("game");
    if (debugParams.get("team") === "1") { selectedOnlineMode = "team2v2"; game.roomMode = "team2v2"; game.friendlyFire = false; updateHud(); }
  }
  const debugType = debugParams.get("type");
  if (["control", "weaponRace", "chaos"].includes(debugType)) {
    game.rules.gameType = debugType;
    if (debugType === "control") {
      const slots = game.roomMode === "team2v2" ? 2 : game.players.length;
      game.objective = { x: 655, radius: 92, target: 3, scores: Array(slots).fill(0) };
    }
    if (debugType === "weaponRace") game.weaponProgress = Array(game.players.length).fill(0);
    if (debugType === "chaos") game.chaosModifier = ["lowGravity", "superWind", "megaBlast", "bouncy", "noGuides"].includes(debugParams.get("chaos")) ? debugParams.get("chaos") : "megaBlast";
    syncForcedWeapon(); updateHud();
  }
  if (["left", "right"].includes(debugParams.get("move"))) {
    const direction = debugParams.get("move") === "left" ? -1 : 1;
    for (let i = 0; i < 15; i += 1) applyMovement(localIndex, direction, 6);
  }
  if (debugParams.get("jump") === "1") performJump(localIndex);
  if (debugParams.get("danger") === "1") { game.turnNumber = 15; game.dangerInset = 112; updateHud(); }
  if (debugParams.get("bot") === "1") { game.turn = 1; game.turnEndsAt = Date.now() + game.rules.turnSeconds * 1000; updateHud(); window.setTimeout(botShot, 100); }
  if (debugParams.get("autofire") === "1") window.setTimeout(requestShot, 250);
}
