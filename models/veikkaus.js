var mongoose = require('mongoose');

var VeikkausSchema = new mongoose.Schema({
	id:	Number,
	closeTime: Number,
	gameName: String,
	brandName: String,
	name: String,
	status: String,
	openTime: Number,
	drawTime: Number,
	resultsAvailableTime: Number,
	gameRuleSet: [{
		maxPrice: Number,
		minStake: Number,
		maxStake: Number,
		oddsType: String
	}],
	rows: [{
		id:	Number,
		status: String,
		includedRowCount: Number,
		tvChannel: String,
		name: String,
		shortName: String,
		description: String,
		detailedDescription: String,
		competitors: [{
			id:	Number,
			name: String,
			odds: [{
				odds: Number
			}],
			status: String,
			handicap: Number		
		}],
		eventId: Number
	}]
});

VeikkausSchema.virtual('date').get(function() {
	
	var d = new Date(this.closeTime);	
	var month = d.getMonth() + 1;
	var day = d.getDate();
	var year = d.getFullYear();
	var dateString=month + "/" + day + "/" + year;
	return dateString;
});

module.exports = mongoose.model('Veikkaus', VeikkausSchema);