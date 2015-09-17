var mongoose = require('mongoose');

var TeamsSchema = new mongoose.Schema({
  name: String,
  user: String,
  power: Number,  
});

TeamsSchema.virtual('name_lower').get(function() {
  return this.name.toLowerCase();
});

module.exports = mongoose.model('Teams', TeamsSchema);