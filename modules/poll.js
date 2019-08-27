const User = require('./user');
const Nodes = require('./nodes');

livePolls = {}

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
			socket.on('add user', this.addUser(user));
			socket.on('forceDisconnect', this.dropUser(user));
			socket.on('unpoll', this.unpoll(user));
			socket.on('le poll', this.updateUser(user))
			socket.on('list participants', this.listParticipants(user))
			socket.on('live feed', this.handleLiveFeed(user))
			socket.on('update pollResult', this.updatePollResult(user))
			socket.on('update serverListParticipants', (data) => this.updatelist(data))
		})
	}
	addUser(user) {
		return (pseudonym) => {
			user.added = true;
			this.nodes.add(user);
		}
	}
	dropUser(user) {
		return () => {
			if(user.pseudonym) {
				delete livePolls[user.pseudonym]
				user.broadcast('live polls', livePolls);
			}
			this.nodes.remove(user);
		}
	}
	fetchListQnP(req, res) {
		const { pseudonym } = req.body;
		this.nodes.list.forEach(user => {
			if(user.pseudonym === pseudonym)
				res.json(user.questions)
		})
	}
	handleLiveFeed(user) {
		return (pseudonym) => {
			let eachQuestionsUpdates = {}; 
			let total = '';
			this.nodes.list.forEach(pUser => {
				if(pUser.pseudonym === pseudonym) {
					total = pUser.totalParticipants;
					for(let i = 0; i < Object.keys(pUser.pollResult[Object.keys(pUser.pollResult)[0]]).length; ++i)
						eachQuestionsUpdates[i] = {'yes': 0, 'no': 0}
					Object.keys(pUser.pollResult).map(id => {
						const result = pUser.pollResult[id];

						Object.keys(result).forEach(q => {
							if(result[q])
								eachQuestionsUpdates[q]['yes'] += 1;
							else
								eachQuestionsUpdates[q]['no'] += 1;
						})
					})
				};
			})
			user.emit('fill live feed', {update: eachQuestionsUpdates, total: total})
		}
	}
	handlePseudonym(req, res) {
		let isAvailable = true;
		const { pseudonym } = req.body;
		this.nodes.list.forEach(user => {
			if(user.pseudonym === pseudonym)
				isAvailable = false;
		})
		if(isAvailable) {
			livePolls[pseudonym] = true;
			res.json({isAvailable: true})
		}
		else
			res.json({isAvailable: false})

	}
	listParticipants(user) {
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
			delete livePolls[user.pseudonym];
			user.pseudonym = '';
			user.broadcast('live polls', livePolls);
		}
	}
	updatePollResult(user) {
		return (data) => {
			this.nodes.list.forEach(pUser => {
				if(pUser.pseudonym === data.pseudonym) {
					pUser.pollResult[user.id] = data.pollResult;
				}
			})
		}
	}
	updateUser(user) {
		return (data) => {
			user.isSecure = data.isSecure;

			let tempListParticipants = {};
			for(let i = 0; i < data.totalParticipants; ++i)
				tempListParticipants[i] = '';
			user.listParticipants = tempListParticipants;

			user.polling = true;
			user.pseudonym = data.pseudonym;
			user.questions = data.questions;
			user.totalParticipants = data.totalParticipants;

			livePolls[data.pseudonym] =data.isSecure;
			user.broadcast('live polls', livePolls);
		}
	}
}

module.exports = Poll;