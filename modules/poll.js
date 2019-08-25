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

			socket.on('remove poll', pseudonym => this.removePoll(pseudonym))
			socket.on('update serverListParticipants', (data) => this.updatelist(data, socket))
		})
	}
	addSurvey(data, socket) { 
		
	}
	handleNew(req, res) {
		console.log(req.body);
		const { isSecure, pseudonym, questions, totalParticipants } = req.body;
		const tempTotalParticipants = {};
		for(let i = 0; i < data.totalParticipants; ++i) {
			tempTotalParticipants[i] = '';
		}
		pollsData[data.pseudonym] = {
			'isSecure': data.isSecure,
			'listParticipants': tempTotalParticipants,
			'questions': data.questions,
			'totalParticipants': data.totalParticipants,
		}
		const tempPolls = polls.map((unit) => {
			return {
				isSecure: pollsData.unit.isSecure,
				pseudonym: unit,
			}
		});
		console.log("time to redirect")
		socket.emit('live polls', tempPolls);
		socket.broadcast.emit('live polls', tempPolls);
		res.json({redirect: true})
	}
	handlePseudonym(req, res) {
		const { pseudonym } = req.body;
		res.json({isAvailable: true});
		polls.forEach(data => {
			if(unit === pseudonym)
				res.json({isAvailable: false});
		})

		polls.push(pseudonym);
		res.json({isAvailable: true})

	}
	removePoll(pseudonym) {
		delete pollsData.pseudonym;
		for(let i = 0; i < polls.length; ++i)
			if(polls[i] === pseudonym) {
				polls.splice(i, 1);

				const tempPolls = polls.map((unit) => {
					return {
						isSecure: pollsData.unit.isSecure,
						pseudonym: unit,
					}
				});
				socket.emit('live polls', tempPolls);
				socket.broadcast.emit('live polls', tempPolls);

				break;
			}
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