var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Teams = require('../models/teams.js');
var Games = require('../models/games.js');
var Powers = require('../models/power.js');
var Veikkaus = require('../models/veikkaus.js');
var Users = require('../models/users.js');
var p = require('./poisson.js');
var request = require('request');
var zlib = require('zlib');

var currentYear = 2016;
var jokerit = "JOKERIT"

var scaleup = 0.075;
var scaledown = -0.075;

var teams = ['Blues', 'HIFK', 'HPK', 'Ilves','JYP', 'KalPa', 'KooKoo', 'Kärpät', 'Lukko', 'Pelicans', 'SaiPa', 'Sport', 'Tappara', 'TPS', 'Ässät'];

function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    res.redirect('/login');
}

/* GET home page. */
router.get('/',isLoggedIn, function(req, res, next) {
  res.render('index', {});
});

/* GET admin page. */
router.get('/voima',isLoggedIn, function(req, res, next) {
  res.render('voima', {});
});

/* PUT /teams/:id */
router.put('/teams/:id', isLoggedIn, function(req, res, next) {
	
	console.log(req.body)
	
  Teams.findByIdAndUpdate(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* GET /teams listing. */
router.get('/teams', isLoggedIn, function(req, res, next) {

	var query = Teams.find().where('user').equals(req.user.email).select('name power').sort('name');
	
	query.exec(function (err, teams) {
	if (err) return next(err);
	console.log(teams);
	res.json(teams);
  });
});

router.get('/user/email/:email/password/:password',isLoggedIn, function(req, res, next) {
	
	var email = req.params.email;
	var password = req.params.password;
	var newUser = new Users();
	
	newUser.email = email;
	newUser.password = newUser.generateHash(password);
	
	newUser.save(function(err) {
        if (err)
			throw err;		
    });
	
	for (i = 0; i < teams.length; i++) { 
		
		var team = new Teams();
		team.name = teams[i].toUpperCase();
		team.user = email;
		team.power = 30;
		
		console.log("adding:"+team);
		
		team.save(function(err) {
        if (err)
			throw err;		
    });
	}
	
	res.sendStatus(200);
	
});

router.get('/events/:eventid/home/:home/visi/:visi', isLoggedIn, function(req, res, next) {
	
	var homeName = req.params.home;
	var visiName = req.params.visi;
	var eventId = req.params.eventid;
		
	var events = [];
		
	var query = Veikkaus.find({'rows.eventId' : eventId });

	query.exec(function (err, eventdata) {
	if (err) return next(err);
	
		for (i = 0; i < eventdata.length; i++) { 		
		
			console.log(eventdata[i].rows[0].shortName);
			console.log(eventdata[i].rows[0].competitors);
		
			var evType = eventdata[i].rows[0].shortName;
			//var handicap = eventdata[i].rows[0].handicap;
		
			var name = '';
			var type = '';
			var home = '';
			var	draw = '';
			var	visi = '';
		
			if (evType == '1X2') {
				name = '1X2';
				type = 'odds';
				home = (eventdata[i].rows[0].competitors[0].odds[0].odds/100).toFixed(2);
				visi = (eventdata[i].rows[0].competitors[1].odds[0].odds/100).toFixed(2);
				draw = (eventdata[i].rows[0].competitors[2].odds[0].odds/100).toFixed(2);
			}			
			else if (evType == 'AWAY_HANDICAP') {
				name = eventdata[i].rows[0].competitors[1].name.toUpperCase();
				type = 'odds';
				home = (eventdata[i].rows[0].competitors[0].odds[0].odds/100).toFixed(2);
				visi = (eventdata[i].rows[0].competitors[1].odds[0].odds/100).toFixed(2);
				draw = (eventdata[i].rows[0].competitors[2].odds[0].odds/100).toFixed(2);
			}
			else if (evType == 'HOME_HANDICAP') {
				name = eventdata[i].rows[0].competitors[0].name.toUpperCase();
				type = 'odds';
				home = (eventdata[i].rows[0].competitors[0].odds[0].odds/100).toFixed(2);
				visi = (eventdata[i].rows[0].competitors[1].odds[0].odds/100).toFixed(2);
				draw = (eventdata[i].rows[0].competitors[2].odds[0].odds/100).toFixed(2);
			}
			
			else if (evType == 'AWAY_OVER_UNDER') {
				name = visiName+' ' +eventdata[i].rows[0].competitors[1].name;
				type = 'odds';
				home = (eventdata[i].rows[0].competitors[0].odds[0].odds/100).toFixed(2);
				visi = (eventdata[i].rows[0].competitors[1].odds[0].odds/100).toFixed(2);				
			}
			else if (evType == 'HOME_OVER_UNDER') {
				name = homeName+' ' +eventdata[i].rows[0].competitors[1].name;
				type = 'odds';
				home = (eventdata[i].rows[0].competitors[0].odds[0].odds/100).toFixed(2);
				visi = (eventdata[i].rows[0].competitors[1].odds[0].odds/100).toFixed(2);				
			}
			
			else if (evType == 'OVER_UNDER') {
				name = eventdata[i].rows[0].competitors[1].name;
				type = 'odds';
				home = (eventdata[i].rows[0].competitors[0].odds[0].odds/100).toFixed(2);
				visi = (eventdata[i].rows[0].competitors[1].odds[0].odds/100).toFixed(2);				
			}
			
			else if (evType == '12') {
				name = 'No draw';
				type = 'odds';
				home = (eventdata[i].rows[0].competitors[0].odds[0].odds/100).toFixed(2);
				visi = (eventdata[i].rows[0].competitors[1].odds[0].odds/100).toFixed(2);				
			}
			
			else if (evType == 'ODD_OR_EVEN_GOALS') {
				name = 'Pariton / Parillinen';
				type = 'odds';
				home = (eventdata[i].rows[0].competitors[0].odds[0].odds/100).toFixed(2);
				visi = (eventdata[i].rows[0].competitors[1].odds[0].odds/100).toFixed(2);				
			}
			
			else {				
				continue;
			}
				
			var event = {	
				name: name,
				home: home,
				draw: draw,
				visi: visi,
				type: type
			};
		
		events.push(event)	
		
		console.log(event);
	}
	
	events.sort(function(a, b){
		return a.name == b.name ? 0 : +(a.name > b.name) || -1;
	});
	
	res.json(events);
	
	});	
});

router.get('/gamesbydate/',isLoggedIn, function(req, res, next) {
	
	var gamesbydate = [];

	// var query = PUser.find({'userID': {$in:array}})
	//var query = Veikkaus.find({season: currentYear}).where('name').ne(jokerit).select('name power').sort('name');
	
	var query = Veikkaus.find({'rows.competitors.name' : {$in:teams}}).where('rows.shortName').equals('1X2');
	
	query.exec(function (err, games) {
	if (err) return next(err);
	
	for (i = 0; i < games.length; i++) { 
				
		var home = '';
		var visi = '';
		var eventId = 0;
				
		for (j = 0; j < games[i].rows.length; j++) { 
		
			home = games[i].rows[j].competitors[0].name;
			visi = games[i].rows[j].competitors[1].name;
			
			eventId = games[i].rows[j].eventId;
		}
		
		if (teams.indexOf(home)==-1 || teams.indexOf(visi)==-1) {
				continue;
		}
		
		var game = {	
			home: home.toUpperCase(),	
			visi: visi.toUpperCase(),
			eventId: eventId,
			date: games[i].date
		};		
		gamesbydate.push(game)	
		
		//console.log(game);
	}
	
	res.json(gamesbydate);
  });
});

router.get('/veikkaus',isLoggedIn, function(req, res, next) {
	
	mongoose.connection.db.dropCollection('veikkaus', function(err, result) {
		if(err) {
			console.log(err);
		}
	});
	
	request({
		url: 'https://www.veikkaus.fi/api/v1/sessions',
		headers: {
			'Content-type':'application/json',
			'Accept':'application/json',
			'X-ESA-API-Key':'ROBOT'
		},
		method: 'POST',		
		json: {
			type: 'STANDARD_LOGIN',
			login: 'xxxx',
			password: 'xxxxx'			
		},
		jar: true
	}, function(error, response, body){
		if(error) {
			console.log(error);
		} 
		else {
		
			console.log(response.statusCode, body);
		
			var buffers = [];
		
			var req = request({
			url: 'https://www.veikkaus.fi/api/v1/sport-games/draws?game-names=EBET',
			headers: {
				'Content-type':'application/json',
				'Accept':'application/json',
				'X-ESA-API-Key':'ROBOT'
			},
			method: 'GET',			
			jar: true
			}, function(error, response, body){
				if(error) {
					console.log(error);
				} else {
		
					console.log(response.headers);
		
					if (response.headers['content-encoding'] === 'gzip') {
					zlib.gunzip(Buffer.concat(buffers), function (gunzipError, bodyBuffer) {
						if (gunzipError) {
							return handleError(gunzipError);
						}
						var charset = obtainCharset(response.headers);
						//console.log(response.headers, bodyBuffer.toString(charset));
						writeData(bodyBuffer.toString(charset));
												
					});
					} else {
						writeData(body);
					}
						
					logout();
					
					res.render('index', {});
				}		
			});
			
			req.on('data', function (buf) {
				buffers[buffers.length] = buf;
			});
		}
	});
});

function writeData(json) {
		
	var jsonData = JSON.parse(json);
											
	Veikkaus.create(jsonData.draws, function (err, veikkausdata) {
						
		if (err) {
			console.log(error);
		}  
	});
}

function logout() {
	
	request({
		url: 'https://www.veikkaus.fi/api/v1/sessions/self',
		headers: {
			'Content-type':'application/json',
			'Accept':'application/json',
			'X-ESA-API-Key':'ROBOT'
		},
		method: 'DELETE',
		jar: true
	}, function(error, response, body){
		if(error) {
		console.log(error);
		}
		console.log(response.headers);
	});
}

function obtainCharset (headers) {
  var charset;
  var contentType = headers['content-type'] || '';
  var matches = contentType.match(/charset=([^;,\r\n]+)/i);
  if (matches && matches[1]) {
    charset = matches[1];
  } 
  return charset || 'utf-8';
}

router.get('/calculate/home/:home/visi/:visi/homepctchange/:homepctchange',isLoggedIn, function(req, res, next) {
		
	var homeName = req.params.home;
	var visiName = req.params.visi;
	var userName = req.user.email;
	var homePctChange = parseInt(req.params.homepctchange);
	
	Teams.findOne({name: homeName, user: userName}).exec(function (err, homeTeam) {
    if (err) return next(err);
		
	Teams.findOne({name: visiName, user: userName}).exec(function (err, visiTeam) {
    if (err) return next(err);		
	
	Powers.findOne({teamname: homeName} ,function (err, homePower) {
    if (err) return next(err);			
	
	Powers.findOne({teamname: visiName} ,function (err, visiPower) {
    if (err) return next(err);
		
	Games.find({home: homeName, visi: visiName} ,function (err, games) {
    if (err) return next(err);
	
		var odds = [];
	
		var homeWin = 0;
		var draw = 0;
		var visiWin = 0;
		
		var homeGoals = 0;
		var visiGoals = 0;
		
		var totalhomeWin = 0;
		var totaldraw = 0;
		var totalvisiWin = 0;
		
		var totalhomeGoals = 0;
		var totalvisiGoals = 0;
		
		var totalhomeWinOt = 0;
		var totalvisiWinOt = 0;
		
		var totalHomeOneGoal = 0;
		var totalVisiOneGoal = 0;
		
		var totalHomeTwoGoal = 0;
		var totalVisiTwoGoal = 0;
		
		var totalHomeThreeGoal = 0;
		var totalVisiThreeGoal = 0;
		
		var oddGoalsGames = 0;
					
			console.log(homeTeam.name + " - " + visiTeam.name)
			console.log(homeTeam.power + " - " + visiTeam.power)
			
		var homeAdv = homePower.totalHomePower / homePower.totalPower;
		var visiAdv = (visiPower.totalPower - visiPower.totalHomePower) / visiPower.totalPower;

			console.log("H:"+homeAdv+" V:"+visiAdv);			
			console.log("HomeAdvPower: "+(homeAdv*homeTeam.power));
			console.log("VisiAdvPower: "+(visiAdv*visiTeam.power));
		
		if ((homeName == 'ILVES' && visiName == 'TAPPARA') || (homeName == 'TAPPARA' && visiName == 'ILVES')) {
			homeAdv = 0.52;
			visiAdv = 0.48;
		}
		
		var powerRatio = (homeAdv*homeTeam.power) / (visiAdv*visiTeam.power);
			console.log(powerRatio);
			
		var val;
		for (val of games) {
			
			if(val.homeWin) homeWin++;
			if(val.visiWin) visiWin++;
			if(val.draw) draw++;
			homeGoals+=val.homeGoals;
			visiGoals+=val.visiGoals;
			
		}
		
		var queryGames = Games.find({}).where('powerRatio').lt(powerRatio+scaleup).gt(powerRatio+scaledown);
		queryGames.exec(function (err, gamesMatch) {
			
			if (err) return next(err);
				
			var game;
			for (game of gamesMatch) {
				
				if(game.homeWin) {
					totalhomeWin++;
					totalhomeWinOt++;
					if(game.homeGoals == game.visiGoals+1) {
						totalHomeOneGoal++;
					}
					else if(game.homeGoals == game.visiGoals+2) {
						totalHomeTwoGoal++;
					}
					else if(game.homeGoals == game.visiGoals+3) {
						totalHomeThreeGoal++;
					}
				}
					
				else if(game.visiWin) {
					totalvisiWin++;
					totalvisiWinOt++;
					if(game.homeGoals+1 == game.visiGoals) {
						totalVisiOneGoal++;
					}
					
					else if(game.homeGoals+2 == game.visiGoals) {
						totalVisiTwoGoal++;
					}
					else if(game.homeGoals+3 == game.visiGoals) {
						totalVisiThreeGoal++;
					}
				}
					
				else if(game.draw) {
					totaldraw++;
					if(game.homeGoalsOt > game.visiGoalsOt) {
						totalhomeWinOt++;						
					} else {
						totalvisiWinOt++;
					}
				}
	
				if (((game.homeGoals+game.visiGoals) % 2) != 0) {					
					oddGoalsGames++;				
				}
				
				totalhomeGoals+=game.homeGoals;
				totalvisiGoals+=game.visiGoals;
			}
		
			var homeTeamWinsWithOneGoal = totalHomeOneGoal/(totaldraw+totalhomeWin+totalvisiWin);
			var visiTeamWinsWithOneGoal = totalVisiOneGoal/(totaldraw+totalhomeWin+totalvisiWin);
		
			var homeTeamWinsWithTwoGoal = totalHomeTwoGoal/(totaldraw+totalhomeWin+totalvisiWin);
			var visiTeamWinsWithTwoGoal = totalVisiTwoGoal/(totaldraw+totalhomeWin+totalvisiWin);
			
			var homeTeamWinsWithThreeGoal = totalHomeThreeGoal/(totaldraw+totalhomeWin+totalvisiWin);
			var visiTeamWinsWithThreeGoal = totalVisiThreeGoal/(totaldraw+totalhomeWin+totalvisiWin);
		
				console.log(totalHomeOneGoal);
				console.log(totalHomeTwoGoal);
				console.log(totalhomeWin);
		
				console.log(homeTeamWinsWithOneGoal + " " + visiTeamWinsWithOneGoal);
				console.log(homeTeamWinsWithTwoGoal + " " + visiTeamWinsWithTwoGoal);	
				console.log(homeTeamWinsWithThreeGoal + " " + visiTeamWinsWithThreeGoal);
				
			var avgHomeGoals = homeGoals / (homeWin+draw+visiWin);
			var avgVisiGoals = visiGoals / (homeWin+draw+visiWin);
			var avgGoals = avgHomeGoals+avgVisiGoals;
		
				console.log("Head2Head: "+homeWin+"W "+draw+"D "+visiWin
					+"L GoalsAverage(Total / Home / Visitor): "+avgGoals.toFixed(2)+" / "+avgHomeGoals.toFixed(2)+" / "+avgVisiGoals.toFixed(2));
					
			var avgtotalHomeGoals = totalhomeGoals / (totalhomeWin+totaldraw+totalvisiWin);
			var avgtotalVisiGoals = totalvisiGoals / (totalhomeWin+totaldraw+totalvisiWin);
			var avgtotalGoals = avgtotalHomeGoals+avgtotalVisiGoals;
		
				console.log("Normal : "+totalhomeWin+"W "+totaldraw+"D "+totalvisiWin
					+"L GoalsAverage(Total / Home / Visitor): "+avgtotalGoals.toFixed(2)+" / "+avgtotalHomeGoals.toFixed(2)+" / "+avgtotalVisiGoals.toFixed(2));
					
			var homewinPct = (totalhomeWin / (totalhomeWin+totaldraw+totalvisiWin)*100)+homePctChange;
			var visiwinPct = (totalvisiWin / (totalhomeWin+totaldraw+totalvisiWin)*100)-homePctChange;
			var drawPct = totaldraw / (totalhomeWin+totaldraw+totalvisiWin)*100;
		
			var homewinPctOt = (totalhomeWinOt / (totalhomeWinOt+totalvisiWinOt)*100)+homePctChange;
			var visiwinPctOt = (totalvisiWinOt / (totalhomeWinOt+totalvisiWinOt)*100)-homePctChange;
		
			var homewinPct100 = homewinPct / 100;
			var visiwinPct100 = visiwinPct / 100;
				
				console.log("Odds: "+homewinPct.toFixed(2)+"% / "+drawPct.toFixed(2)+"% / "+visiwinPct.toFixed(2)+"%");
			
			var homeodds = 100 / homewinPct;
			var drawodds = 100 / drawPct;
			var visiodds = 100 / visiwinPct;
		
				console.log("1x2: "+homeodds.toFixed(2)+" / "+drawodds.toFixed(2)+" / "+visiodds.toFixed(2));
				var o1 = {	
					name: '1X2',
					home: homeodds.toFixed(2),
					draw: drawodds.toFixed(2),
					visi: visiodds.toFixed(2),
					type: 'odds'
				};	
				odds.push(o1)	
				
			var homeMlOdds = 1 / (homewinPct100 / (homewinPct100+visiwinPct100));
			var visiMlOdds = 1 /(1-(1/homeMlOdds));
		
				console.log("DNB: "+homeMlOdds.toFixed(2)+" / "+visiMlOdds.toFixed(2));
				var o2 = {	
					name: 'DNB',
					home: homeMlOdds.toFixed(2),
					draw: '',
					visi: visiMlOdds.toFixed(2),
					type: 'odds'
				};	
				odds.push(o2)	
				
			var oddsh1 = 0;
			//		double oddsd1 = 0.25;
			//		double oddsd2 = 0.225;
			var oddsd1 = homeTeamWinsWithOneGoal;
			var oddsd2 = homeTeamWinsWithTwoGoal;
			var oddsd3 = homeTeamWinsWithThreeGoal;
			var oddsv1 = 0;
			
			oddsh1 =  1 / (homewinPct100 - oddsd1);
			oddsv1 =  1 / (1 - homewinPct100 + oddsd1);
			
				console.log("1x2+1.5 Visi: "+oddsh1.toFixed(2)+" / "+oddsv1.toFixed(2));
				var o3 = {	
					name: visiName+' +1.5',
					home: oddsh1.toFixed(2),
					draw: '',
					visi: oddsv1.toFixed(2),
					type: 'odds'
				};	
				odds.push(o3)
	
			oddsv1 = (drawPct/100)+(visiwinPct/100);			
			oddsh1 = 1 - oddsd1 - oddsv1;
			
				console.log("1x2+1 Visi: "+(1/oddsh1).toFixed(2)+" / "+(1/oddsd1).toFixed(2)+" / "+(1/oddsv1).toFixed(2));
				var o4 = {	
					name: visiName+' +1',
					home: (1/oddsh1).toFixed(2),
					draw: (1/oddsd1).toFixed(2),
					visi: (1/oddsv1).toFixed(2),
					type: 'odds'
				};	
				odds.push(o4)
				
			//oddsh1 = (1-oddsd2) / (homewinPct100-oddsd1-oddsd2);
			//oddsv1 = 1 / (1 - (1 / oddsh1) - oddsd2);
			
			oddsv1 = (drawPct/100)+(visiwinPct/100)+oddsd1;			
			oddsh1 = 1 - oddsd2 - oddsv1;
				
				console.log("1x2+2 Visi: "+(1/oddsh1).toFixed(2)+" / "+(1/oddsd2).toFixed(2)+" / "+(1/oddsv1).toFixed(2));
				var o5 = {	
					name: visiName+' +2',
					home: (1/oddsh1).toFixed(2),
					draw: (1/oddsd2).toFixed(2),
					visi: (1/oddsv1).toFixed(2),
					type: 'odds'
				};	
				odds.push(o5)
				
			oddsv1 = (drawPct/100)+(visiwinPct/100)+oddsd1+oddsd2;			
			oddsh1 = 1 - oddsd3 - oddsv1;
				
				console.log("1x2+3 Visi: "+(1/oddsh1).toFixed(2)+" / "+(1/oddsd3).toFixed(2)+" / "+(1/oddsv1).toFixed(2));
				var o55 = {	
					name: visiName+' +3',
					home: (1/oddsh1).toFixed(2),
					draw: (1/oddsd3).toFixed(2),
					visi: (1/oddsv1).toFixed(2),
					type: 'odds'
				};	
				odds.push(o55)
			
			oddsd1 = visiTeamWinsWithOneGoal;
			oddsd2 = visiTeamWinsWithTwoGoal;
			oddsd3 = visiTeamWinsWithThreeGoal;
			
			oddsv1 =  1 / (visiwinPct100 - oddsd1);
			oddsh1 =  1 / (1 - visiwinPct100 + oddsd1);
			
				console.log("1x2+1.5 Home: "+oddsh1.toFixed(2)+" / "+(1/oddsd1).toFixed(2)+" / "+oddsv1.toFixed(2));
				var o6 = {	
					name: homeName+' +1.5',
					home: oddsh1.toFixed(2),
					draw: (1/oddsd1).toFixed(2),
					visi: oddsv1.toFixed(2),
					type: 'odds'
				};	
				odds.push(o6)
			
			oddsh1 = (drawPct/100)+(homewinPct/100);			
			oddsv1 = 1 - oddsd1 - oddsh1;
			
				console.log("1x2+1 Home: "+(1/oddsh1).toFixed(2)+" / "+(1/oddsd1).toFixed(2)+" / "+(1/oddsv1).toFixed(2));
				var o7 = {	
					name: homeName+' +1',
					home: (1/oddsh1).toFixed(2),
					draw: (1/oddsd1).toFixed(2),
					visi: (1/oddsv1).toFixed(2),
					type: 'odds'
				};	
				odds.push(o7)
						
			//oddsv1 = (1-oddsd2) / (visiwinPct100-oddsd1-oddsd2);
			//oddsh1 = 1 / (1 - (1 / oddsv1) - oddsd2);
			
			oddsh1 = (drawPct/100)+(homewinPct/100)+oddsd1;			
			oddsv1 = 1 - oddsd2 - oddsh1;
			
				console.log("1x2+2 Home: "+(1/oddsh1).toFixed(2)+" / "+(1/oddsd2).toFixed(2)+" / "+(1/oddsv1).toFixed(2));
				var o8 = {	
					name: homeName+' +2',
					home: (1/oddsh1).toFixed(2),
					draw: (1/oddsd2).toFixed(2),
					visi: (1/oddsv1).toFixed(2),
					type: 'odds'
				};	
				odds.push(o8)
				
			oddsh1 = (drawPct/100)+(homewinPct/100)+oddsd1+oddsd2;			
			oddsv1 = 1 - oddsd3 - oddsh1;
			
				console.log("1x2+3 Home: "+(1/oddsh1).toFixed(2)+" / "+(1/oddsd3).toFixed(2)+" / "+(1/oddsv1).toFixed(2));
				var o88 = {	
					name: homeName+' +3',
					home: (1/oddsh1).toFixed(2),
					draw: (1/oddsd3).toFixed(2),
					visi: (1/oddsv1).toFixed(2),
					type: 'odds'
				};	
				odds.push(o88)
	
			var underPct = p.probability(4,avgtotalGoals);			
			var overPct = 1-underPct;
			var underOdds = 1 / underPct;
			var overOdds = 1 / overPct;
		
				console.log("\nUnder / Over 4.5: "+underOdds.toFixed(2)+" / "+overOdds.toFixed(2));
				var o10 = {	
					name: 'Yli 4,5 maalia',
					home: underOdds.toFixed(2),
					draw: '',
					visi: overOdds.toFixed(2),
					type: 'under'
				};	
				odds.push(o10)
			
			underPct = p.probability(5,avgtotalGoals);
			overPct = 1-underPct;
			underOdds = 1 / underPct;
			overOdds = 1 / overPct;
			
				console.log("\nUnder / Over 5.5: "+underOdds.toFixed(2)+" / "+overOdds.toFixed(2));
				var o11 = {	
					name: 'Yli 5,5 maalia',
					home: underOdds.toFixed(2),
					draw: '',
					visi: overOdds.toFixed(2),
					type: 'under'
				};	
				odds.push(o11)
			
			var underover = function(X, str) {
				var underPct;
				var overPct;
				var underOdds;
				var overOdds;
		
				underPct = p.probability(2,X);
				overPct = 1-underPct;
				underOdds = 1 / underPct;
				overOdds = 1 / overPct;
				
					console.log(str+" Yli 2,5 maalia: "+underOdds.toFixed(2)+" / "+overOdds.toFixed(2));
					var o12 = {	
						name: str+' Yli 2,5 maalia',
						home: underOdds.toFixed(2),
						draw: '',
						visi: overOdds.toFixed(2),
						type: 'under'
					};	
					odds.push(o12)
				
				underPct = p.probability(3,X);
				overPct = 1-underPct;
				underOdds = 1 / underPct;
				overOdds = 1 / overPct;
				
					console.log(str+" Yli 3,5 maalia: "+underOdds.toFixed(2)+" / "+overOdds.toFixed(2));
					var o13 = {	
						name: str+' Yli 3,5 maalia',
						home: underOdds.toFixed(2),
						draw: '',
						visi: overOdds.toFixed(2),
						type: 'under'
					};	
					odds.push(o13)
			}
			
			underover(avgtotalHomeGoals, homeName);
			underover(avgtotalVisiGoals, visiName);
			
				console.log("\nNo draw : "+totalhomeWinOt+"W "+totalvisiWinOt
					+"L GoalsAverage(Total / Home / Visitor): "+avgtotalGoals.toFixed(2)+" / "+avgtotalHomeGoals.toFixed(2)+" / "+avgtotalVisiGoals.toFixed(2));
	
				console.log("Odds: "+homewinPctOt.toFixed(2)+"% / "+visiwinPctOt.toFixed(2)+"%");
		
			var homeoddsOt = 100 / homewinPctOt;		
			var visioddsOt = 100 / visiwinPctOt;
		
				console.log("1x2: "+homeoddsOt.toFixed(2)+" / "+visioddsOt.toFixed(2));
				
				var o9 = {	
					name: 'No draw',
					home: homeoddsOt.toFixed(2),
					draw: '',
					visi: visioddsOt.toFixed(2),
					type: 'odds'
				};	
				odds.push(o9)
		
			var oddGoalsOdd = oddGoalsGames / gamesMatch.length;
			var evenGoalsOdd = 1 - oddGoalsOdd;
						
				console.log("Pariton / Parillinen: "+(1/oddGoalsOdd).toFixed(2)+" / "+(1/evenGoalsOdd).toFixed(2));
		
				var o99 = {	
					name: 'Pariton / Parillinen',
					home: (1/oddGoalsOdd).toFixed(2),
					draw: '',
					visi: (1/evenGoalsOdd).toFixed(2),
					type: 'odds'
				};	
				odds.push(o99)
			
var o111 = {
	
    name: homeName +' - ' + visiName,
    home: homeWin + 'W' ,
	draw: draw + 'D',
	visi: visiWin + 'L',
	type: 'info'
};	
odds.push(o111)	
var o222 = {
	
    name: 'Goals Average',
    home: avgGoals.toFixed(2),
	draw: avgHomeGoals.toFixed(2),
	visi: avgVisiGoals.toFixed(2),
	type: 'info'
};	
odds.push(o222)

var o333 = {
	
    name: ' Similar teams',
    home: totalhomeWin + 'W',
	draw: totaldraw + 'D',
	visi: totalvisiWin + 'L',
	type: 'info'
};
odds.push(o333);
		
var o444 = {
	
    name: ' Similar teams GA',
    home: avgtotalGoals.toFixed(2),
	draw: avgtotalHomeGoals.toFixed(2),
	visi: avgtotalVisiGoals.toFixed(2),
	type: 'info'
};
odds.push(o444);

var o555 = {
	
    name: ' Odds %',
    home: homewinPct.toFixed(2)+'%',
	draw: drawPct.toFixed(2)+'%',
	visi: visiwinPct.toFixed(2)+'%',
	type: 'info'
};
odds.push(o555);

var o666 = {
	
    name: ' No draw similar teams %',
    home: totalhomeWinOt+'W',
	draw: '',
	visi: totalvisiWinOt+'L',
	type: 'info'
};
odds.push(o666);

var o777 = {
	
    name: ' No draw Odds %',
    home: homewinPctOt.toFixed(2)+'%',
	draw: '',
	visi: visiwinPctOt.toFixed(2)+'%',
	type: 'info'
};
odds.push(o777);

		res.json(odds);
		
		
		});
		

	});
	});
	});
	});
	});
	
});

module.exports = router;