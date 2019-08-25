const User = require('./user');

pollsData = {

}
polls = []

class Poll {
	constructor(io) {
		this.io = io;
	}

	init() {
		this.attachIOEvents();
	}

	attachIOEvents() {
		this.io.on('connection', (socket) => {
			let user = new User(socket);

			socket.on('new user', this.addUser(user));
			socket.on('new survey', (data) => this.addSurvey(data, socket))
			socket.on('update serverListParticipants', (data) => this.updatelist(data, socket))
		})
	}
	addSurvey(data, socket) { 
		pollsData[data.pseudonym] = {
			'isSecure': data.isSecure,
			'questions': data.questions,
			'totalParticipants': data.totalParticipants,
		}
		polls.push({isSecure: data.isSecure, pseudonym: data.pseudonym});
		socket.emit('live polls', polls)
		socket.broadcast.emit('live polls', polls)
	}
	handlePseudonym(req, res) {
		const { pseudonym } = req.body;
		console.log(pseudonym, pollsData);
		res.json({isAvailable: true});
		/*try {
			if(pollsData.pseudonym)
				return res.send({isAvailable: true});
		}
		catch(e) {
			pollsData[pseudonym] = {};
			return res.send({isAvailable: false})
		}*/

	}
	removeSurvey() {

	}
	updatelist(data, socket) {
		pollsData.listParticipants[data.index] = data.name;
		socket.broadcast.emit('update clientListParticipants', pollsData.listParticipants)
	}
	addUser(user) {
		return (data) => {
			if(user.added) return;

			try {
				if(pollsData[data.pseudonym]) {
					user.added = true;
					user.pseudonym = data.pseudonym;
				}
			}
			catch(e) {
				this.io.broadcast('not available');
			}
		}
	}
}

module.exports = Poll;