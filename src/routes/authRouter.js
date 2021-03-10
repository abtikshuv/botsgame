const express = require('express');
const { asyncMiddleware } = require('../utils/middlewares');
const router = express.Router();

module.exports = function (passport) {

    router.post('/login', asyncMiddleware(async (req, res) => {
        passport.authenticate('local', { session: true }, (err, user) => {
            if (!user)
                return res.status(401).send('Unauthorized');

            if (err)
                return res.status(500).send('error');

            req.logIn(user, (err) => {
                if (err)
                    return res.status(500).send('error');

                return res.send('Logged in successfully');
            })
        })(req, res);
    }))

    return router;
};