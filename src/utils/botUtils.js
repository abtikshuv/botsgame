const fs = require('fs');

const { getGroupCurrentBotVersion } = require("./dbUtils");

const getBot = (groupId, version) => {
    if (!version)
        version = getGroupCurrentBotVersion(groupId);

    let dir = `./bots/${groupId}/${version}.js`;
    if (!fs.existsSync(dir))
        return null;

    return require("../../" + dir);
};

module.exports = {
    getBot,
};