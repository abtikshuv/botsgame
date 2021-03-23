const { expose } = require('threads/worker');
expose({runTurn:

	function runTurn(ID, D, Z, N, R, ZONES, DRONES, EXTRA) {
		let resObj = {};
		if (!EXTRA.alreadyinit) {
			resObj.alreadyinit = true;
		}
		let myDrones = DRONES.filter(d => d.owner == ID)
		myDrones.forEach((d, i) => d.toZone = (i % Z))
		let locations = [];
		myDrones.forEach(d => {
			locations.push({ droneid: d.droneID, x: ZONES[d.toZone].x, y: ZONES[d.toZone].y })
		})
		return {drones: locations, extra: {}};
				
	}
/*     function runTurn(ID, D, Z, N, R, ZONES, DRONES, EXTRA) {
        // ID - Player id
        // D  - Number of Drones
        // Z  - Number of Zones
        // N  - Number of players
        // R - Radius of a zone
        // ZONES    =    ARRAY OF { zoneID: id, owner: -1, x: x, y: y }
        // DRONES   =    ARRAY OF { droneID: id, owner: -1, x: x, y: y }
        // EXTRA    =    Extra object passed to next turn
        // RETURN VALUE:
        // {drones: ARRAY OF {droneid: id, x: x, y: y} , extra: {everythingYouWant}
        return { drones: [], extra: {} };
    }
 */	
	
})

module.exports = { runTurn };