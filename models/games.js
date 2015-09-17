var mongoose = require('mongoose');

var GamesSchema = new mongoose.Schema({  
  homePower: Number,
  visiPower: Number,
  homeGoals: Number,
  visiGoals: Number,
  home: String,
  visi: String,
  homeGoalsOt: Number,
  visiGoalsOt: Number,
  powerRatio: Number,
  draw: Boolean,
  homeWin: Boolean,
  visiWin: Boolean,
});

module.exports = mongoose.model('Games', GamesSchema);