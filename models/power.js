var mongoose = require('mongoose');

var PowersSchema = new mongoose.Schema({
  teamname: String,
  totalPower: Number,
  totalHomePower: Number,  
});

module.exports = mongoose.model('Powers', PowersSchema);