
const gameController = require('./gameController');
const gameController2 = require('./gameController2');
const { getNextGameId, saveGameToDb, getAllGroups, getLeaderboard, setLeaderboard } = require('../utils/dbUtils');
const { clearGames } = require('../utils/dbUtils')


const gameExecTimes = [[10, 0], [10, 30], [11, 0], [11, 30], [12, 0], [12, 30], [13, 0], [13, 30], [14, 0], [14, 30], [15, 0]]
//FOR TESTING -->
//const gameExecTimes = [[13, 15], [13, 45], [14, 15], [14, 45]]
const GAMESEACHRUN = 5; // SHOULD BE 5 // * number of playes | MAX SCORE = 5*number_of_players ~ 50
const RANDOMGAMESEACHRUN = 10; // SHOULD BE 10 // MAX SCORE = 3*10 = 30




async function createGame(players) {

    let currentGameController = gameController;
    if ((new Date()).getHours() >= 13) { //13
        currentGameController = gameController;
    }

    let gameid = await getNextGameId()
    let playerForObj = players.map(p => { let obj = { playerid: p.id, version: p.botVersion }; return obj })
    //players = players.map(p => { return { playerid: p.id, bot: getBot(p.id, p.botVersion), botPath: '../../bots/'+p.id+'/'+p.botVersion } });
    players = players.map(p => { return { playerid: p.id, botPath: '../../bots/' + p.id + '/' + p.botVersion } });
    let gameObject = await currentGameController.runGame(players, gameid);


    // STUBBBBBBB

    // "players": [
    //     {
    //       "playerid": "Avi",
    //       "version": 20
    //     }
    //   ],
    //   "noDrones": 5,
    //   "noZones": 6,
    //   "zonesInitSatate": [],
    //   "dronesInitState": [],
    //   "finalPoints": [{"playerid": "Avi", "points": 3},{"playerid": "Avi", "points": 2},{"playerid": "Avi", "points": 1},{"playerid": "Avi", "points": 0} ]
    // }

    await saveGameToDb({
        gameid: gameid,
        players: playerForObj,
        noDrones: parseInt(gameObject.script[0].drones.length / players.length),
        noZones: gameObject.script[0].zones.length,
        zonesInitSatate: gameObject.script[0].zones,
        dronesInitState: gameObject.script[0].drones,
        finalPoints: gameObject.finalPoints
    })
    return gameObject.finalPoints;
}

module.exports = function () {

    setInterval(async () => {
        let d = new Date();
        let arr = [d.getHours(), d.getMinutes()];
        if (gameExecTimes.some(v => v[0] === arr[0] && v[1] === arr[1])) {
            try {
                await clearGames();
                gameExecTimes.splice(gameExecTimes.findIndex(v => v[0] === arr[0] && v[1] === arr[1]), 1);
                let finalPointsList = [];
                let finalPointsListMultiplayers = [];
                let players = getAllGroups();
                for (let i = 0; i < players.length - 1; i++) {
                    console.log(i);
                    for (let j = i + 1; j < players.length; j++) {
                        for (let k = 0; k < GAMESEACHRUN; k++) {
                            finalPointsList.push(await createGame([players[i], players[j]]));
                        }
                    }
                    if (players.length >= 4) {
                        for (let k = 0; k < RANDOMGAMESEACHRUN; k++) {
                            let selectedPlayers = [i];
                            while (selectedPlayers.length < 4) {
                                let index = Math.floor(Math.random() * players.length);
                                if (!selectedPlayers.includes(index)) selectedPlayers.push(index);
                            }
                            finalPointsListMultiplayers.push(await createGame([players[selectedPlayers[0]], players[selectedPlayers[1]], players[selectedPlayers[2]], players[selectedPlayers[3]]]));
                        }
                    }
                }

                let currentLeaderboard = await getLeaderboard();
                let pointssum = [];
                currentLeaderboard.forEach(p => {
                    let playerobj = {};
                    let participate = finalPointsList.filter(f => f.some(fp => fp.playerid === p.name));
                    let participateMultiplayer = finalPointsListMultiplayers.filter(f => f.some(fp => fp.playerid === p.name));
                    let dualScore = participate.map(f =>
                        f.filter(fp => fp.playerid === p.name
                        )[0].points).reduce((a, b) => a + b, 0);
                    let MultiplayerScore = participateMultiplayer.map(f =>
                        f.filter(fp => fp.playerid === p.name
                        )[0].points).reduce((a, b) => a + b, 0);
                    MultiplayerScore = participateMultiplayer.length === 0 ? 0 : Math.round(10 * (MultiplayerScore / participateMultiplayer.length))
                    playerobj.score = dualScore + MultiplayerScore;
                    playerobj.name = p.name;
                    pointssum.push(playerobj);
                })
                let sorted = pointssum.sort((a, b) => b.score - a.score);
                for (let i = 0; i < currentLeaderboard.length; i++) {
                    let index = await sorted.findIndex(s => s.name === currentLeaderboard[i].name);
                    currentLeaderboard[i].positions.push(index + 1);
                    currentLeaderboard[i].score = sorted[index].score;
                }
                setLeaderboard(currentLeaderboard);
            }
            catch (e) { console.log(e) }
        }
    }, 45000)

};