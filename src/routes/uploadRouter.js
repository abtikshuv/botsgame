const express = require('express');
const router = express.Router();

const { uploadBot, getAllBotVersions } = require('../utils/fileUtils');
const { runBot } = require('../utils/botUtils');

const { asyncMiddleware } = require('../utils/middlewares');

router.post('/bot', (req, res) => {
    const { botCode } = req.body;

    uploadBot(req.user.group, botCode).then((success) => {
        res.send(success);
    });
    console.log('upload bot new done')
});

router.get('/allBots', asyncMiddleware(async (req, res) => {
    res.json({ bots: await getAllBotVersions(req.user.group) });
}))

router.post('/temp', (req, res) => {
    const { botCode } = req.body;

    uploadBot(req.user.group, botCode, true).then((success) => {
        res.send(success);
    });
});

module.exports = router;