var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var usersSchema = mongoose.Schema({	
	email: String,
    password: String    	
});

usersSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

usersSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('Users', usersSchema);