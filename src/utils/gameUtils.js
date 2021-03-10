const { getNextGameId, saveGameToDb, getGroupCurrentBotVersion } = require("./dbUtils");

const saveGame = async (groups, startState, winner) => {
    let gameObj = {
        id: await getNextGameId(),
        groups: groups.map(g => ({ groupName: g, version: getGroupCurrentBotVersion(g) })),
        startState,
        winner,
    };

    await saveGameToDb(gameObj);
};

module.exports = {
    saveGame,
};