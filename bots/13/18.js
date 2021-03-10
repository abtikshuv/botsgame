const { expose } = require('threads/worker');
expose({runTurn:function (ID, D, Z, N, R, ZONES, DRONES, EXTRA) {try {
this will fail
return runTurn(ID, D, Z, N, R, ZONES, DRONES, EXTRA);}catch (e) {return {drones: [], extra: {}, error: e}}}})

module.exports = { runTurn };