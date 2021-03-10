const express = require('express');
const app = express.Router();


const uploadRouter = require('./uploadRouter');
const authRouter = require('./authRouter');
const gameRouter = require('./gameRouter');
const { accessProtectionmiddleware, asyncMiddleware } = require('../utils/middlewares');
const { checkUser, getLeaderboard, getGame, getGroupsNames } = require('../utils/dbUtils');


const router = (passport) => {
    app.use('/auth', authRouter(passport));

    app.use(accessProtectionmiddleware);
    //app.use((req, res, next) => { req.user = { group: "test" }; next() });

    app.use('/upload', uploadRouter);

    app.use('/game', gameRouter);

    app.get('/leaderboard', async function (req, res) {
        try {
            res.json(await getLeaderboard(req.user))
        }
        catch (e) {
            console.log(e);
        }
    })

    app.get('/users', async function (req, res) {
        try {
            res.json(await getGroupsNames())
        }
        catch (e) {
            console.log(e);
        }
    })

    app.get('/game/temp', asyncMiddleware(async function (req, res, next) {
        //gameData = {} //FROM DB;
        players = [{ playerid: 27, bot: getBot("example", "temp") }, { playerid: 8, bot: getBot("example", "example") }, { playerid: 9, bot: getBot("example", "example") }, { playerid: 1, bot: getBot("example", "example") }];
        stub = await gameController.runGame(players);
        res.json(stub);
    }));

    return app;
}

module.exports = router;