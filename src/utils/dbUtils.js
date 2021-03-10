const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const { readFile } = require('../utils/fileUtils')

const sql = require('mssql')

const nodeSql = require("node-sql");

const CONNECTION_STRING = `Server=tm-badger-db;User Id=badger-db;Password=Newyork1!;Database=bots;Integrated Security=True;Trusted Connection=True`;
//const CONNECTION_STRING = `mssql://NAVY/badger_DB_sa:FASand4iou$!@tm-badger-db.navy.idf/bots`;



// var config = {
//     server: 'tm-badger-db',
//     user: 'NAVY/badger_DB_sa',
//     password: 'FASand4iou$!',
//     database: 'bots',
//     options: {
//         trustedConnection: true,
//     }
//     // port: ''
// }

getConnection = async () => {
    var pool = await new sql.ConnectionPool(CONNECTION_STRING);
    return await pool.connect();
}

const dbConfig = {
    userName: 'badger-db',
    password: 'Newyork1!',
    authentication: {
        // type: 'defualt',
        // options: {
        // },
    },
    server: 'tm-badger-db',
    domain: 'navy.idf.il',
};

const adapterGroups = new FileSync('./db/groups.json')
const dbGroups = low(adapterGroups)


dbGroups.defaults({
    groups: [{ id: 'test', password: 'test' }]
}).write();

const adapterGames = new FileSync('./db/games.json')
const dbGames = low(adapterGames)

dbGames.defaults({
    games: []
}).write();

const adapterLeaderboard = new FileSync('./db/leaderboard.json')
const dbLeaderboard = low(adapterLeaderboard)

dbLeaderboard.defaults({
    leaderboard: []
}).write();


const checkUser = (name, password) => {
    if (name === "admin" && password === "hackyhacky123!")
        return true;

    let group = dbGroups.get('groups').find({ name: name, password }).value();
    return group != null;
};

const getGroup = (group) => {
    return dbGroups.get('groups').find({ name: group }).value();
};

const getAllGroups = (group) => {
    return dbGroups.get('groups').value();
};

const updateGroup = async (group, update) => {

    // update is always alters BOTVERSION

    // let result = null;
    // var pool = null;

    // try {
    //     pool = await getConnection();
    //     result = await new Promise((res, rej) => {
    //         pool.request().query(`UPDATE groups SET botVersion=${update.botVersion} WHERE name=${group}`, (err, count) => {
    //             if (err) rej(err);
    //             res(count>0);
    //         })
    //     });

    //     return result;
    // } catch (error) {
    //     console.log(error);

    // } finally {
    //     if (pool)
    //         pool.close();
    // }

    // return result;


    let currentGroup = getGroup(group);
    let updatedGroup = {
        ...currentGroup,
        ...update,
    };

    let groups = dbGroups.get("groups").value();
    let groupIndex = groups.findIndex(g => g.name === group);
    groups[groupIndex] = updatedGroup;

    dbGroups.set("groups", groups).write();
};

const getGroupCurrentBotVersion = (groupName) => {
    let group = getGroup(groupName);
    if (!group)
        return null;

    return group.botVersion;
};

const getNextGameId = async () => {

    // let result = null;
    // var pool = null;

    // try {
    //     pool = await getConnection();
    //     result = await new Promise((res, rej) => {
    //         pool.request().query(`SELECT MAX(id) FROM gamesObject`, (err, rows) => {
    //             if (err) rej(err);
    //             res(parseInt(rows[0])+1);
    //         })
    //     });

    //     return result;
    // } catch (error) {
    //     console.log(error);

    // } finally {
    //     if (pool)
    //         pool.close();
    // }

    // return result;

    return dbGames.get("games").value().length + 1;
};

const saveGameToDb = async (gameObj) => {

    // let result = null;
    // var pool = null;

    // try {
    //     pool = await getConnection();
    //     result = await new Promise((res, rej) => {
    //         pool.request().query(`INSERT INTO gamesObject VALUES (${gameObj.id},${JSON.stringify(gameObj)})`, (err, count) => {
    //             if (err) rej(err);
    //             res(count>0);
    //         })
    //     });

    //     return result;
    // } catch (error) {
    //     console.log(error);

    // } finally {
    //     if (pool)
    //         pool.close();
    // }

    // return result;

    dbGames.get("games").push(gameObj).write();
};

const getGroupsNames = async () => {

    // let result = null;
    // var pool = null;

    // try {
    //     pool = await getConnection();
    //     result = await new Promise((res, rej) => {
    //         pool.request().query(`SELECT id, name FROM groups`, (err, rows) => {
    //             if (err) rej(err);
    //             res(rows.map(r => ({id: r.id, name: r.name})));
    //         })
    //     });

    //     return result;
    // } catch (error) {
    //     console.log(error);

    // } finally {
    //     if (pool)
    //         pool.close();
    // }

    // return result;

    data = await dbGroups.get('groups').value();
    data = data.map(g => { return { id: g.id, name: g.name } })
    return data
};

// SUMMARY
const getAllGames = async () => {

    // let result = null;
    // var pool = null;

    // try {
    //     pool = await getConnection();
    //     result = await new Promise((res, rej) => {
    //         pool.request().query(`SELECT gameObject FROM gamesObject`, (err, rows) => {
    //             if (err) rej(err);
    //             res(rows.map(r => JSON.parse(r.gameObject)));
    //         })
    //     });

    //     return result;
    // } catch (error) {
    //     console.log(error);

    // } finally {
    //     if (pool)
    //         pool.close();
    // }

    // return result;

    return dbGames.get("games").value();
};

const getAllGamesByUser = async (group) => {

    // let result = null;
    // var pool = null;

    // try {
    //     pool = await getConnection();
    //     result = await new Promise((res, rej) => {
    //         pool.request().query(`SELECT gameObject FROM gamesObject`, (err, rows) => {
    //             if (err) rej(err);
    //             let temprows = rows.map(r => JSON.parse(r.gameObject))
    //             temprows = temprows.filter(g => g.players.some((p => p.playerid === parseInt(id))))
    //             res(temprows);
    //         })
    //     });

    //     return result;
    // } catch (error) {
    //     console.log(error);

    // } finally {
    //     if (pool)
    //         pool.close();
    // }

    // return result;

    let { id } = getGroup(group);
    let data = dbGames.get("games").value();
    data = data.filter(g => g.players.some((p => p.playerid === parseInt(id))))
    return {
        games: data,
        userId: id,
    };
};

// SPECIFIC
const getGame = async (id) => {

    // let result = null;
    // var pool = null;

    // try {
    //     pool = await getConnection();
    //     result = await new Promise((res, rej) => {
    //         pool.request().query(`SELECT gameObject FROM gamesObject WHERE gameID=${id}`, (err, rows) => {
    //             if (err) rej(err);
    //             res(rows.map(r => JSON.parse(r.gameObject)));
    //         })
    //     });

    //     return result;
    // } catch (error) {
    //     console.log(error);

    // } finally {
    //     if (pool)
    //         pool.close();
    // }

    // return result;

    return dbGames.get("games").find({ gameid: id }).value();
};

const getLeaderboard = async (user) => {

    // let result = null;
    // var pool = null;

    // try {
    //     pool = await getConnection();
    //     result = await new Promise((res, rej) => {
    //         pool.request().query('SELECT * FROM Leaderboard', (err, rows) => {
    //             if (err) rej(err);
    //             let a;
    //            // res(rows.map(r => JSON.parse(r.leaderboardObject)));
    //         })
    //     });

    //     return result;
    // } catch (error) {
    //     console.log(error);

    // } finally {
    //     if (pool)
    //         await pool.close();
    // }

    // return result;
    if (new Date().getHours() >= 15 && (!user || user.group !== "admin")) return [];
    return dbLeaderboard.get("leaderboard").value();
}

const setLeaderboard = async (data) => {


    // let result = null;
    // var pool = null;

    // try {
    //     pool = await getConnection();
    //     result = await new Promise((res, rej) => {
    //         pool.request().query(`UPDATE Leaderboard SET leaderboardObject=${JSON.stringify(data)} WHERE name=${data.name}`, (err, count) => {
    //             if (err) rej(err);
    //             res(count>0);
    //         })
    //     });

    //     return result;
    // } catch (error) {
    //     console.log(error);

    // } finally {
    //     if (pool)
    //         pool.close();
    // }

    // return result;

    dbLeaderboard.update("leaderboard", data).write();
}

const clearGames = async () => {

    // let result = null;
    // var pool = null;

    // try {
    //     pool = await getConnection();
    //     result = await new Promise((res, rej) => {
    //         pool.request().query(`DELETE FROM Leaderboard`, (err, count) => {
    //             if (err) rej(err);
    //             res(count>0);
    //         })
    //     });

    //     return result;
    // } catch (error) {
    //     console.log(error);

    // } finally {
    //     if (pool)
    //         pool.close();
    // }

    // return result;

    await dbGames.get("games").remove().write();
}


module.exports = {
    checkUser,
    getGroup,
    updateGroup,
    getGroupCurrentBotVersion,
    getNextGameId,
    saveGameToDb,
    getAllGames,
    getGame,
    getLeaderboard,
    setLeaderboard,
    getAllGroups,
    getAllGamesByUser,
    clearGames,
    getGroupsNames
};