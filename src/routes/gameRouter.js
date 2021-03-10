const express = require('express');
const router = express.Router();

const { asyncMiddleware } = require('../utils/middlewares');

const { getBot } = require('../utils/botUtils')

const { getAllGames, getAllGamesByUser, getGame } = require('../utils/dbUtils')
const gameController = require('../gameWorker/gameController');
const gameController2 = require('../gameWorker/gameController2');

router.get('/temp', asyncMiddleware(async function (req, res, next) {
    try {
        //gameData = {} //FROM DB;
        players = [{ playerid: 27, bot: getBot("example", "temp") }, { playerid: 8, bot: getBot("example", "example") }, { playerid: 9, bot: getBot("example", "example") }, { playerid: 1, bot: getBot("example", "example") }];
        stub = await gameController.runGame(players);
        res.json(stub);
    }
    catch (e) {
        console.log(e)
    }
}));

router.get('/byid/:id', asyncMiddleware(async function (req, res, next) {
    try {
        let info = await getGame(parseInt(req.params.id));
        //let players = info.players.map(p => { let obj = { playerid: p.playerid, bot: getBot(p.playerid, p.botVersion) }; return obj });
        let players = info.players.map(p => { let obj = { playerid: p.playerid, botPath: '../../bots/' + p.playerid + '/' + p.version }; return obj });


        let currentGameController = gameController;
        if ((new Date()).getHours() >= 13) { // 13
            currentGameController = gameController;
        }

        let game = await currentGameController.runGame(players, info.gameid, info.noDrones, info.noZones, info.zonesInitSatate, info.dronesInitState);
        res.json(game);
    }
    catch (e) {
        console.log(e)
    }
}));

router.get('/all', asyncMiddleware(async function (req, res, next) {
    try {
        //let games = getAllGames();
        let games = await getAllGamesByUser(req.user.group)
        res.json(games);
    }
    catch (e) {
        console.log(e)
    }
}));



module.exports = router;