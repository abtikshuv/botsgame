
const _ = require("lodash");

const { spawn, Thread, Worker } = require('threads');

const { readFile } = require('../utils/fileUtils')
const fs = require('fs')

const gameHeight = 100;
const gameWidth = 200;

const splitAreasX = 6;
const splitAreasY = 4

const xBlockSize = gameWidth / splitAreasX;
const yBlockSize = gameHeight / splitAreasY;

const zoneRadius = 5
const spaceBetweenDrones = 5;

const numberOfRounds = 800; // SHOULD BE 800
const roundTimeout = 15000;

const INIT_FUEL = 660; //600 (because its x2)


function initObjects(players, gameid, noDrones, noZones, zonesInitSatate, dronesInitState) {
    let numberOfDrones = noDrones || Math.floor(Math.random() * 4 + 4); // Number of drones is between 4 to 8
    let numberOfZones = noZones || Math.floor(Math.random() * 6 + 4); // Number of drones is between 4 to 10
    let zones = zonesInitSatate || createZones(players, numberOfZones);
    let drones = dronesInitState || createDrones(players, numberOfDrones);
    let gameID = gameid;
    //players.forEach(p => gameID += "-" + p.playerid);
    let scores = {};
    players.forEach(p => scores[p.playerid] = 0);
    let script = [{ zones, drones, scores: scores }];
    return { gameid: gameID, noDrones: numberOfDrones, noZones: numberOfZones, players: players.map(p => p.playerid), script: script, winner: -1 };
}

function createZone(id, players, areaX, areaY, fixedX, fixedY) { //NEW!
    let x = fixedX || Math.floor(Math.random() * Math.floor(xBlockSize) + (areaX * Math.floor(xBlockSize)));
    let y = fixedY || Math.floor(Math.random() * Math.floor(yBlockSize) + (areaY * Math.floor(yBlockSize)));
    let playerDronesCount = [];

    for (let i = 0; i < players.length; i++) playerDronesCount.push({ playerid: players[i].playerid, drones: 0 });

    return { zoneID: id, playerDronesCount: playerDronesCount, owner: -1, x: x, y: y };
}

function createZones(players, numberOfZones) {
    let zones = [];
    let areas = [];
    for (let i = 0; i < splitAreasX; i++)
        for (let j = 0; j < splitAreasY; j++)
            if (!((i == 0 && j == 0) || (i == splitAreasX - 1 && j == splitAreasY - 1) || (i == 0 && j == splitAreasY - 1) || (i == splitAreasX - 1 && j == 0)))
                areas.push({ x: i, y: j });

    for (let i = 0; i < numberOfZones; i++) {
        let selectedAreaIndex = Math.floor(Math.random() * areas.length);
        let zone = createZone(i, players, areas[selectedAreaIndex].x, areas[selectedAreaIndex].y);
        areas.splice(selectedAreaIndex, 1);
        zones.push(zone);
    }

    // NEW! add fuel zone
    let fuelZone = createZone(999, players, null, null, Math.floor(gameWidth / 2), Math.floor(gameHeight / 2)); // NEW!
    fuelZone.type = "FUEL";
    zones.push(fuelZone);

    return zones;
}

function createDrones(players, numberOfDrones) {

    let drones = [];
    let xBase, yBase;
    let xDirection, yDirection;
    let perSide = Math.round(Math.sqrt(numberOfDrones));

    for (let i = 0; i < players.length; i++) {
        for (let j = 0; j < numberOfDrones; j++) {
            if (i % 2 == 0) {
                xBase = 0;
                xDirection = 1;
            }
            else {
                xBase = gameWidth;
                xDirection = -1;
            }
            if (i == 0 || i == 3) {
                yBase = 0;
                yDirection = 1;
            }
            else {
                yBase = gameHeight;
                yDirection = -1;
            }
            let droneX = (xDirection * spaceBetweenDrones) + xBase + (xDirection * spaceBetweenDrones * parseInt(j / perSide));
            let droneY = (yDirection * spaceBetweenDrones) + yBase + (yDirection * spaceBetweenDrones * (j % perSide));
            drones.push({ droneID: i * numberOfDrones + j, owner: players[i].playerid, x: droneX, y: droneY, fuel: INIT_FUEL }); // NEW!
        }
    }

    return drones;
}

function updateLocations(drone, newLocation) {
    // IF THERE MORE ACCURATE PATH CALCULATION? 
    // CURRENT STRATEGY:
    //
    //       *
    //        \
    //         \
    //          ---*
    if (drone.fuel > 0) { // NEW!

        let prevX = drone.x;
        let prevY = drone.y;

        if (newLocation.x > drone.x) drone.x = drone.x + 1;
        else if (newLocation.x < drone.x) drone.x = drone.x - 1;
        if (newLocation.y > drone.y) drone.y = drone.y + 1;
        else if (newLocation.y < drone.y) drone.y = drone.y - 1;
        if (drone.y < 0) drone.y = 0;
        if (drone.x < 0) drone.x = 0;
        if (drone.y > gameHeight - 1) drone.y = gameHeight - 1;
        if (drone.x > gameWidth - 1) drone.x = gameWidth - 1;
        
        // NEW!
        if(prevX === drone.x && prevY === drone.y){
            drone.fuel--;
        }
        else{
            drone.fuel-=2; 
        }
    }
}

function findMax(playerDronesCount) {
    let maxValue = -1;
    playerDronesCount.forEach(c => {
        if (c.drones > maxValue) maxValue = c.drones;
    });
    return maxValue;
}

function updateZones(zone, drones) {
    let insideTheZone = drones.filter(d => (Math.sqrt(Math.pow(d.x - zone.x, 2) + Math.pow(d.y - zone.y, 2))  <= zoneRadius));
    let grouped = {};
    let playerDrones = [];

    zone.playerDronesCount.forEach(z => z.drones = 0)

    insideTheZone.forEach(d => {
        if (grouped[d.owner]) {
            grouped[d.owner] = grouped[d.owner] + 1;
        }
        else {
            grouped[d.owner] = 1;
        }
    })
    for (const [id, count] of Object.entries(grouped)) {
        playerDrones.push({ playerid: id, drones: count });
        zone.playerDronesCount.find(a => a.playerid == id).drones = count;
    }

    if (zone.type === "FUEL") { // NEW!
        insideTheZone.forEach(d => d.fuel = INIT_FUEL);
    }
    else {
        let maxValue = _.maxBy(playerDrones, d => d.drones);
        let countOfOwner = (zone.owner == -1) ? 0 : zone.playerDronesCount.find(p=>p.playerid===zone.owner).drones; // Make sure you need X+1 drones to change color
        if (maxValue && (countOfOwner < maxValue.drones)) zone.owner = parseInt(maxValue.playerid);
    }
}

function updateScores(scoresList, i, zones) {
    let filteredZones = zones.filter(z => z.owner == i && z.type !== "FUEL"); // NEW!
    scoresList[i] = scoresList[i] + filteredZones.length;
}

function calculateStep(roundNumber, gameObject, roundBotInstructions) {
    let copyDrones = _.cloneDeep(gameObject.script[roundNumber - 1].drones);
    let copyZones = _.cloneDeep(gameObject.script[roundNumber - 1].zones);
    let copyScores = _.cloneDeep(gameObject.script[roundNumber - 1].scores);

    copyDrones.forEach(d => updateLocations(d, roundBotInstructions[d.owner] ? (roundBotInstructions[d.owner].find(r => r.droneid == d.droneID) || []) : []));
    copyZones.forEach(z => updateZones(z, copyDrones));
    Object.keys(copyScores).forEach(k => updateScores(copyScores, k, copyZones));

    gameObject.script.push({ zones: copyZones, drones: copyDrones, scores: copyScores });
}

function updateWinner(gameObject) {
    let finalPoints = [];
    let players = gameObject.players;
    let scores = players.map(p => { let obj = { playerid: p, points: gameObject.script[gameObject.script.length - 1].scores[p] }; return obj })
    scores = scores.sort((a, b) => b.points - a.points);
    finalPoints = scores.map((s, i) => { return { playerid: s.playerid, points: players.length - 1 - i } })
    gameObject.finalPoints = finalPoints;
}

function createTimeout(ms, func) {
    let mypromise = new Promise((res, rej) => {
        try {
            result = func();
            res(result);
        }
        catch (e) {
            res('Timeout');
        }
    });
    let timeoutpromise = new Promise((res, rej) => {
        setTimeout(() => {
            res('Timeout');
        }, ms);
    })

    return Promise.race([timeoutpromise, mypromise]);

}

async function playRound(roundNumber, gameObject, players, initRound) {
    let zonesFilteredObj = _.cloneDeep(gameObject.script[roundNumber - 1].zones);
    zonesFilteredObj.forEach(z => delete z.playerDronesCount);
    let botsResults = {};
    for (let k = 0; k < players.length; k++) {

        if (players[k].threadBot) {
            //let ownedDrones = gameObject.script[roundNumber - 1].drones.filter(d => d.owner == p.playerid).map(d => d.droneID); // VERIFY IF HE CAN CONTROL THAT BOT
            //let res = await createTimeout(roundTimeout, () => p.botInstance.runTurn(zonesFilteredObj, gameObject.script[roundNumber - 1].drones));
            //let res = p.botInstance.runTurn(zonesFilteredObj, gameObject.script[roundNumber - 1].drones) // Information given: zones (With id, owner and location), drones(with id, owner and location)
            // botsResults[p.playerid] = res.filter(d => ownedDrones.includes(d.droneid)); // directions = [{droneid: , x:, y:}]


            let extra = initRound ? {} : players[k].extra;
            //let botFunc = players[k]bot;

            let bot = players[k].threadBot;
            players[k].roundFinished = false;

            let input = { p: players[k].playerid, nd: gameObject.noDrones, nz: gameObject.noZones, pl: gameObject.players.length, zr: zoneRadius, zfo: zonesFilteredObj, dr: gameObject.script[roundNumber - 1].drones, ex: extra };
            //console.time('turn' + roundNumber + ":" + k);
            //let turnPromise = players[k].threadBot !== "DISQUALIFIED" ? players[k].threadBot.runTurn(input.p, input.nd, input.nz, input.pl, input.zr, input.zfo, input.dr, input.ex) : "TIMEOUT";
            if (players[k].threadBot !== "DISQUALIFIED") {
                try {
                    turnPromise = players[k].threadBot.runTurn(input.p, input.nd, input.nz, input.pl, input.zr, input.zfo, input.dr, input.ex)
                }
                catch (e) {
                    turnPromise = "TIMEOUT";
                }
            }
            else {
                turnPromise = "TIMEOUT";
            }

            let timeoutPromise = new Promise((res, rej) => setTimeout(() => {
                if (players[k].threadBot !== "DISQUALIFIED" && !players[k].roundFinished) {
                    Thread.terminate(players[k].threadBot); //await?
                    players[k].threadBot = "DISQUALIFIED";
                }
                res("TIMEOUT");
            }, roundTimeout)); // Thread.terminate(players[k].threadBot);

            let racePromise = Promise.race([turnPromise, timeoutPromise]).then(v => {
                // console.timeEnd('turn' + roundNumber + ":" + k);
                if (v === "TIMEOUT") {
                    botsResults[players[k].playerid] = [];
                    players[k].extra = players[k].extra || {};
                }
                else {
                    botsResults[players[k].playerid] = v.drones;
                    players[k].extra = v.extra || {};
                    players[k].roundFinished = true;
                }
            })
            await racePromise;

            //////////// WITHOUT THREADS - WORKS ///////////////
            // let res = await createTimeout(roundTimeout, () => botFunc.runTurn(p.playerid, gameObject.noDrones,
            //     gameObject.noZones,
            //     gameObject.players.length,
            //     zoneRadius,
            //     zonesFilteredObj,
            //     gameObject.script[roundNumber - 1].drones,
            //     extra)) //ID, D, Z, N, R, ZONES, DRONES, EXTRA

            // botsResults[p.playerid] = res.drones;
            // p.extra = res.extra;
        }
    }

    players.forEach(p => {
        let ownedDrones = gameObject.script[roundNumber - 1].drones.filter(d => d.owner == p.playerid).map(d => d.droneID); // VERIFY IF HE CAN CONTROL THAT BOT
        try {
            botsResults[p.playerid] = (botsResults[p.playerid] === "Timeout") ? [] : (botsResults[p.playerid].filter(d => ownedDrones.includes(d.droneid)));
        }
        catch (e) {
            botsResults[p.playerid] = [];
        }
    });

    return botsResults;
}


//players=[{playerid, bot},...]
async function runGame(players, gameid, noDrones, noZones, zonesInitSatate, dronesInitState) {

    let initTurn = true;
    let gameObject = initObjects(players, gameid, noDrones, noZones, zonesInitSatate, dronesInitState);

    for (let i = 0; i < players.length; i++) {
        if (players[i].botPath) {
            let success = true;
            try {
                const vm = require('vm');
                let blabla = fs.readFileSync(players[i].botPath.substring(4, players[i].botPath.length) + ".js");
                let blabla2 = await vm.createContext({});
                let ressss = await vm.runInContext(blabla, blabla2); // will fail here on syntax check
            }
            catch (e) {
                if (e.message !== "require is not defined")
                    success = false;
            }
            if (success)
                players[i].threadBot = await spawn(new Worker(players[i].botPath)); // will run only if prev line succeed
            else {
                players[i].threadBot = "DISQUALIFIED";
            }
        }
    }

    for (let i = 0; i <= numberOfRounds; i++) {
        let roundBotInstructions = await playRound(i + 1, gameObject, players, initTurn);
        calculateStep(i + 1, gameObject, roundBotInstructions);
        if (initTurn) initTurn = false;
    }

    for (let i = 0; i < players.length; i++) {
        if (players[i].threadBot !== "DISQUALIFIED") await Thread.terminate(players[i].threadBot);
    }

    updateWinner(gameObject, players);

    return gameObject;
}

exports.runGame = runGame;