class Details {
	constructor(socket) {
		this.added = false;
		this.id = socket.id;
		this.pseudonym = null;
		this.socket = socket;
	}
}

module.exports = Details;