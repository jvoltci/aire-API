const User = require('./user');
const Nodes = require('./nodes');

livePolls = []

class Poll {
	constructor(io) {
		this.io = io;
		this.nodes = new Nodes();
	}

	init() {
		this.attachIOEvents();
	}

	attachIOEvents() {
		this.io.on('connection', (socket) => {
			let user = new User(socket);

			this.io.sockets.emit('live polls', livePolls);
			//socket.on('add user', this.addUser(user));
			socket.on('forceDisconnect', this.dropUser(user));
			socket.on('unpoll', this.unpoll(user));
			socket.on('le poll', this.updateUser(user))
			socket.on('list participants', this.listParticipants(user))
			socket.on('update serverListParticipants', (data) => this.updatelist(data))
		})
	}
	addUser(user) {
		user.added = true;
		this.nodes.add(user);
	}
	dropUser(user) {
		return () => {
			if(user.pseudonym) {
				livePolls = livePolls.filter(poll => poll.pseudonym !== user.pseudonym)
				user.broadcast('live polls', livePolls);
			}
			this.nodes.remove(user);
		}
	}
	handlePseudonym(req, res) {
		let isAvailable = true;
		const { pseudonym } = req.body;
		this.nodes.forEach(user => {
			if(user.pseudonym === pseudonym)
				isAvailable = false;
		})
		if(isAvailable) {
			livePolls.push({pseudonym: pseudonym})
			res.json({isAvailable: true})
		}
		else
			res.json({isAvailable: false})

	}
	listParticipants() {
		return (pseudonym) => {
			let list = {};
			this.nodes.list.forEach(user => {
				if(user.pseudonym === pseudonym)
					list = user.listParticipants;
			})
			user.emit('update clientListParticipants', list)
		}
	}
	unpoll(user) {
		return () => {
			user.pseudonym = '';
			livePolls = livePolls.filter(poll => poll.pseudonym !== user.pseudonym)
			user.broadcast('live polls', livePolls);
		}
	}
	updateUser(user) {
		return (data) => {
			user.isSecure = data.isSecure;

			tempListParticipants = {};
			for(let i = 0; i < data.totalParticipants; ++i)
				tempListParticipants[i] = '';
			user.listParticipants = tempListParticipants;

			user.pseudonym = data,pseudonym;
			user.questions = data.questions;
			user.totalParticipants = data.totalParticipants;

			livePolls.push(data.pseudonym);
			user.broadcast('live polls', livePolls);
		}
	}
}

module.exports = Poll;