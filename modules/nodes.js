class nodes {
  constructor() {
    this.list = [];
  }

  add(user) {
    this.list.push(user);
  }

  remove(user) {
    if (this.list.length === 1) this.list = [];
    let idx = this.list.indexOf(user);
    if (idx >= 0) this.list.splice(idx, 1);
  }
}

module.exports = nodes;
