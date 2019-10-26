export default class BottomlessStack {
  constructor(size) {
    this.size = size;
    this.store = [];
  }

  push(element) {
    this.store.push(element);
    if (this.store.length > this.size) {
      this.store.shift();
    }
  }

  pop() {
    return this.store.pop();
  }

  isEmpty() {
    return this.store.length == 0;
  }
}
