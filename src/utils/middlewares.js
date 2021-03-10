const asyncMiddleware = fn =>
    (req, res, next) => {
        Promise.resolve(fn(req, res, next))
            .catch(next);
    };

const accessProtectionmiddleware = (req, res, next) => {
    if (req.isAuthenticated())
        next();
    else
        res.status(401).send('Unauthorized!');
};

module.exports = {
    asyncMiddleware,
    accessProtectionmiddleware,
}