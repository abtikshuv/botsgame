const fs = require('fs');

const { getGroup, updateGroup } = require('./dbUtils');

const forbiddenPhrases = [
    /require/,
    /eval/,
];

const writeFile = (name, content) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(name, content, (err) => {
            if (err) {
                console.log(err);
                reject(err);
            }

            resolve();
        });
    })
        .then(() => true, (reason) => false)
        .catch((reason) => false);
};

const uploadBot = async (groupName, botCode, temp = false) => {
    console.log('upload bot!!!')
    if (forbiddenPhrases.some(f => f.test(botCode)))
        return `some of the following forbidden strings were found: ${forbiddenPhrases.join(', ')}`;

    let { botVersion = 0, id: groupId } = getGroup(groupName);
    console.log('upload bot after get group!!!')

    let dir = `./bots/${groupId}`;
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir);

    let newBotVersion = botVersion + 1;
    console.log('upload bot new version' + newBotVersion)

    await updateGroup(groupName, { botVersion: newBotVersion });

    const wrappedBotCode = `const { expose } = require('threads/worker');
expose({runTurn:function (ID, D, Z, N, R, ZONES, DRONES, EXTRA) {try {
${botCode}
return runTurn(ID, D, Z, N, R, ZONES, DRONES, EXTRA);}catch (e) {return {drones: [], extra: {}, error: e}}}})

module.exports = { runTurn };`;

    return writeFile(`${dir}/${temp ? 'temp' : newBotVersion}.js`, wrappedBotCode);
};

const getAllBotVersions = async (group) => {
    let allVersions = [];

    let { botVersion: activeVersion, id: groupId } = getGroup(group);
    for (let i = 1; i <= activeVersion; i++) {
        let dir = `./bots/${groupId}/${i}.js`;
        if (fs.existsSync(dir)) {
            let botCode = await readFile(dir);
            allVersions.push(botCode.substring(117, botCode.length - 141));
        }
    }

    return allVersions;
};

const readFile = async (name) => {
    return new Promise((resolve, reject) => {
        fs.readFile(name, 'utf8', (err, data) => {
            resolve(data);
        });
    })
        .catch((reason) => false);
}

module.exports = {
    uploadBot,
    readFile,
    getAllBotVersions
};