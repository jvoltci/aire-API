const User = require('./user');

pollsData = {
	/*'flai': {
		'isSecure': true,
		'listParticipants': {
			'0': 'Jai',
			'1': '',
			'2': '',
		},
		'questions': ["There?", "Yes?"],
		'totalParticipants': 10,
	}*/
}

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

			this.io.sockets.emit('live polls', this.curatePolllList());
			socket.on('remove poll', pseudonym => this.removePoll(pseudonym))
			socket.on('update serverListParticipants', (data) => this.updatelist(data))
		})
	}
	addSurvey(data, socket) { 
		
	}
	curatePolllList() {
		const tempPolls = Object.keys(pollsData).map((unit) => {
			return {
					isSecure: pollsData[unit].isSecure,
					pseudonym: unit,
				}
		});
		return tempPolls;
	}
	handleListParticipants(req, res) {
		const { pseudonym } = req.body;
		res.status(200).json(pollsData[pseudonym].listParticipants);
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
		this.io.sockets.emit('live polls', this.curatePolllList());
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
				this.io.sockets.emit('live polls', tempPolls);
				break;
			}
	}
	updatelist(data) {
		pollsData[data.pseudonym].listParticipants[data.index] = data.name;
		io.sockets.emit('update clientListParticipants', pollsData[data.pseudonym].listParticipants)
	}
}

module.exports = Poll;