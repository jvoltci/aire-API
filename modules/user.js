class User {
  constructor(socket) {
    this.added = false;
    this.polling = false;
    this.socket = socket;

    this.pseudonym = '';
    this.isSecure = false;
    this.listParticipants = {}
    this.questions = [];
    this.totalParticipants = 0;
    this.totalQ = 0;
    this.pollResult = {};
    this.id = socket.id;
  }

  emit(evt, data) {
    this.socket.emit(evt, data);
  }

  broadcast(evt, data) {
    this.socket.broadcast.emit(evt, data);
  }
}

module.exports = User;
