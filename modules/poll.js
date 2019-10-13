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
			socket.on('disconnect', this.dropUser(user));
			socket.on('unpoll', this.unpoll(user));
			socket.on('le poll', this.updateUser(user))
			socket.on('update pollResult', this.updatePollResult(user))
			socket.on('update pseudonym', this.updateUserPseudonym(user))
			socket.on('update serverListParticipants', this.updateParticipantsList(user))
		})
	}
	addUser(user) {
		return (pseudonym) => {
			this.nodes.add(user);
		}
	}
	dropUser(user) {
		return () => {
			if(user.pseudonym && user.isPolling) {
				delete livePolls[user.pseudonym]
				user.broadcast('live polls', livePolls);
			}
			this.nodes.remove(user);
		}
	}
	fetchListQnP(req, res) {
		const { pseudonym } = req.body;
		this.nodes.list.forEach(user => {
			if(user.pseudonym === pseudonym && user.isPolling)
				res.json(user.questions)
		})
	}
	fetchLiveFeed(req, res) {
		const { pseudonym } = req.body;
		let eachQuestionsUpdates = {};
		let user = '';
		let total = '';
		this.nodes.list.forEach(pUser => {
			if(pUser.pseudonym && pUser.isPolling) {
				user = pUser;
				total = pUser.totalParticipants;
				for(let i = 0; i < pUser.questions.length; ++i)
					eachQuestionsUpdates[i] = {'yes': 0, 'no': 0}
				Object.keys(pUser.pollResult).map(id => {
					const result = pUser.pollResult[id];

					Object.keys(result).forEach(q => {
						if(result[q] === '1')
							eachQuestionsUpdates[q]['yes'] += 1;
						else
							eachQuestionsUpdates[q]['no'] += 1;
					})
				})
			};
		})
		
		if(user) {
			res.json({update: eachQuestionsUpdates, total: total})
			user.broadcast('update live feed', {update: eachQuestionsUpdates, total: total})
		}
		else {
			res.redirect('https://alre.ml/#/error')
		}
	}
	handleLiveFeed(pseudonym, user) {
		let eachQuestionsUpdates = {};
		let total = '';
		this.nodes.list.forEach(pUser => {
			if(pUser.pseudonym === pseudonym && pUser.isPolling) {
				total = pUser.totalParticipants;
				for(let i = 0; i < pUser.questions.length; ++i)
					eachQuestionsUpdates[i] = {'yes': 0, 'no': 0}
				Object.keys(pUser.pollResult).map(id => {
					const result = pUser.pollResult[id];
					Object.keys(result).forEach(q => {
						if(result[q] === '1')
							eachQuestionsUpdates[q]['yes'] += 1;
						else
							eachQuestionsUpdates[q]['no'] += 1;
					})
				})
			};
		})
		this.nodes.list.forEach(pUser => {
			if(pUser.pseudonym === pseudonym)
				pUser.emit('update live feed', {update: eachQuestionsUpdates, total: total})
		})
		user.emit('update live feed', {update: eachQuestionsUpdates, total: total})
		//this.io.sockets.emit('update live feed', {update: eachQuestionsUpdates, total: total})
	}
	handlePseudonym(req, res) {
		let isAvailable = true;
		const { pseudonym } = req.body;
		/*this.nodes.list.forEach(user => {
			if(user.pseudonym === pseudonym)
				isAvailable = false;
		})*/
		try {
			if(livePolls[pseudonym]) {
				console.log("In Check, not Available")
				res.json({isAvailable: false});
			}
		}
		catch(e) {
			console.log("Errror, Available")
			res.json({isAvailable: true});
		}

	}
	listParticipants(req, res) {
		const { pseudonym } = req.body;
		let list = {};
		this.nodes.list.forEach(pUser => {
			if(pUser.pseudonym === pseudonym && pUser.isPolling)
				list = pUser.listParticipants;
		})
		res.json(list);
		//pUser.emit('update clientListParticipants', list)
	}
	unpoll(user) {
		return (pseudonym) => {
			if(user.pseudonym === pseudonym && user.isPolling) {
				delete livePolls[user.pseudonym];
				user.isPolling = false;
				user.pseudonym = '';
				this.io.sockets.emit('live polls', livePolls);
			}
		}
	}
	updateParticipantsList(user) {
		return ({pseudonym, index, name}) => {
			let list = '';
			this.nodes.list.forEach(pUser => {
				if(pUser.pseudonym === pseudonym && pUser.isPolling) {
					pUser.listParticipants[index].name = name;
					list = pUser.listParticipants;
					//pUser.broadcast('update clientListParticipants', pUser.listParticipants)
				}
			})
			this.nodes.list.forEach(pUser => {
				if(pUser.pseudonym === pseudonym) {
					pUser.emit('update clientListParticipants', list)
				}
			})
		}
	}
	updatePollResult(user) {
		return (data) => {
			this.nodes.list.forEach(pUser => {
				if(pUser.pseudonym === data.pseudonym && pUser.isPolling) {
					pUser.pollResult[user.id] = data.pollResult;
				}
			})
			this.handleLiveFeed(data.pseudonym, user);
		}
	}
	updateUser(user) {
		return (data) => {
			if(!this.nodes.list.includes(user))
				this.nodes.add(user);
			user.isSecure = data.isSecure;

			let tempListParticipants = {};
			for(let i = 0; i < data.totalParticipants; ++i) {
				if(user.isSecure)
					tempListParticipants[i] = {name: '', isAdded: false}
				else
					tempListParticipants[i] = {name: '', isAdded: true}
			}
			user.listParticipants = tempListParticipants;

			user.isPolling = true;
			user.pseudonym = data.pseudonym;
			user.questions = data.questions;
			user.totalParticipants = data.totalParticipants;

			livePolls[data.pseudonym] = data.isSecure;
			user.broadcast('live polls', livePolls);
		}
	}
	updateUserPseudonym(user) {
		return (pseudonym) => {
			if(!this.nodes.list.includes(user))
				this.nodes.add(user);
			user.pseudonym = pseudonym;
		}
	}
}

module.exports = Poll;