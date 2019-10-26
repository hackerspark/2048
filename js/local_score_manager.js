export default class LocalScoreManager {
  constructor() {
    this.key = "bestScore";
    this.storage = window.localStorage;
  }

  get() {
    return this.storage.getItem(this.key) || 0;
  }

  set(score = 0) {
    this.storage.setItem(this.key, score);
  }
}
