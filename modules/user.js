class User {
  constructor(socket) {
    this.added = false;
    this.socket = socket;
    this.id = socket.id;
  }

  emit(evt, data) {
    this.socket.emit(evt, data);
  }

  broadcast(evt, data) {
    this.socket.broadcast(evt, data);
  }
}

module.exports = User;
