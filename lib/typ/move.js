var Move = module.exports = function(id, position, answer, createdAt) {
  this.id = id;
  this.position = position;
  this.answer = answer;
  this.createdAt = createdAt || new Date();
}
