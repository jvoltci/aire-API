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
		const { isSecure, pseudonym, questions, totalParticipants } = req.body;
		const tempTotalParticipants = {};
		for(let i = 0; i < totalParticipants; ++i) {
			tempTotalParticipants[i] = '';
		}
		pollsData[pseudonym] = {
			'isSecure': isSecure,
			'listParticipants': tempTotalParticipants,
			'questions': questions,
			'totalParticipants': totalParticipants,
		}
		console.log(pollsData)
		console.log(polls)
		const tempPolls = polls.map((unit) => {
			if(unit)
				return {
					console.log("In ", pollsData, unit);
					isSecure: pollsData.unit.isSecure,
					pseudonym: unit,
				}
		});
		console.log("time to redirect")
		this.io.sockets.emit('live polls', tempPolls);
		res.json({redirect: true})
	}
	handlePseudonym(req, res) {
		const { pseudonym } = req.body;
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
				delete pollsData.pseudonym;
				socket.emit('live polls', tempPolls);
				socket.broadcast.emit('live polls', tempPolls);

				break;
			}
	}
	updatelist(data, socket) {
		/*pollsData.listParticipants[data.index] = data.name;
		socket.broadcast.emit('update clientListParticipants', pollsData.listParticipants)*/
	}
}

module.exports = Poll;