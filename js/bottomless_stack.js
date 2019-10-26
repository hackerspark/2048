// When the stack starts to overflow,
// this one discards elements from the bottom
// instead from the top.
// Example for size 3:
// initial   [
// push 1    [1
// push 2    [1 2
// push 3    [1 2 3
// push 4    [2 3 4  (1 got dropped from the bottom)
// push 5    [3 4 5
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
