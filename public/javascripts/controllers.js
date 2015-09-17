var app = angular.module('app', ['ngRoute', 'ngResource'])

app.factory('TeamsUpdate', ['$resource', function($resource){
          return $resource('/teams/:id', null, {
            'update': { method:'PUT' }
          });
}]);

app.factory('Teams', ['$http', function($http){
          return {
          list: function(callback){
            $http.get('/teams').success(callback);
          }
        };
}]);

app.factory('Logout', ['$http', function($http){
          return {
          logout: function(callback){
            $http.post('/logout').success(callback);
          }
        };
}]);

app.controller('LoginController', function($scope, $http, $resource) {
	
	

});

app.controller('TeamlistController', function($scope, $resource, $window, Teams, Logout) {
	
	$scope.oddsData = {};
	$scope.formData = {};
	$scope.formData.show = false;
	
	$scope.showgameselector = true;
	$scope.showdaysgamesselector = false;
	
	$scope.formData.today = new Date();
		
	Teams.list(function(teams) {
		$scope.teamlist = teams;
	});
	
	$scope.showHome = function() {
		$scope.showgameselector = true;
		$scope.showdaysgamesselector = false;
	}
	
	$scope.showDaysGames = function() {
		
		$scope.formData.home == null;
		$scope.formData.visi == null;
		
		$scope.getDaysGames();
		$scope.showgameselector = false;
		$scope.showdaysgamesselector = true;
	}
		
	$scope.getDaysGames = function() {
				
		$scope.daysgames = {};
	
		var gamesbydate = $resource('/gamesbydate');			
		gamesbydate.query({}, function(response) {
			$scope.daysgames = response;
		});
	}
		
	$scope.calculate = function() {
		
		var home = $scope.formData.home;
		var visi = $scope.formData.visi;
		
		if ($scope.formData.home == null || $scope.formData.visi == null) {
			
			return;
		}
				
		var homepctchange = $scope.formData.slider;
		
		var odds = $resource('/calculate/home/:home/visi/:visi/homepctchange/:homepctchange');
			
		odds.query({home: home, visi: visi, homepctchange: homepctchange}, function(response) {
	
			$scope.oddsData = response;
		});	
	}
	
	$scope.calculateDaysGames = function() {
		
		var parsed = JSON.parse($scope.formData.game);
				
		var home = parsed.home;
		var visi = parsed.visi;
		var eventid = parsed.eventId;
		
		if (home == null || visi == null) {
			
			return;
		}
				
		var homepctchange = $scope.formData.slider;
		
		var odds = $resource('/calculate/home/:home/visi/:visi/homepctchange/:homepctchange');
			
		odds.query({home: home, visi: visi, homepctchange: homepctchange}, function(response) {
				
			$scope.oddsData = response;			
		});
		
		var events = $resource('/events/:eventid/home/:home/visi/:visi');
		events.query({eventid: eventid, home: home, visi: visi}, function(response) {
	
			$scope.eventData = response;			
		});
	}
	
	function objectFindByKey(array, key, value) {
		for (var i = 0; i < array.length; i++) {
			if (array[i][key] === value) {
				return array[i];
			}
		}
		return null;
	}
	
	$scope.getPelattavaStyle = function(name, column) {
		
		var oddsCalc = objectFindByKey($scope.oddsData, 'name', name);
		var oddsVeikkaus = objectFindByKey($scope.eventData, 'name', name);
				
		if(oddsCalc == null || oddsVeikkaus == null) {
			return false;		
		}
		
		if(column == 'home' && oddsVeikkaus.home != null && parseFloat(oddsVeikkaus.home) > parseFloat(oddsCalc.home)) {
			
			return getColor(oddsVeikkaus.home, oddsCalc.home);			
		}
		
		else if(column == 'draw' && oddsVeikkaus.draw != null && parseFloat(oddsVeikkaus.draw) > parseFloat(oddsCalc.draw)) {
			
			return getColor(oddsVeikkaus.draw, oddsCalc.draw);				
		}
		
		else if(column == 'visi' && oddsVeikkaus.visi != null && parseFloat(oddsVeikkaus.visi) > parseFloat(oddsCalc.visi)) {
			
			return getColor(oddsVeikkaus.visi, oddsCalc.visi);				
		}		
		
		return 'rgb(255, 255, 255)';			
	}
	
	function getColor( veik, calc) {
		
		var ero = (parseFloat(veik) - parseFloat(calc)) * 2;
		
		if (ero > 1) {
			ero = 1;
		}			
		return 'rgba(0, 255, 0,' +ero +')';		
	}
	
	$scope.getIsPelattava = function(name, column) {
				
		var oddsCalc = objectFindByKey($scope.oddsData, 'name', name);
		var oddsVeikkaus = objectFindByKey($scope.eventData, 'name', name);
		
		var rajoilla = 0.1;
		
		if(oddsCalc == null || oddsVeikkaus == null) {
			return false;
		}
				
		if(column == 'home' && oddsVeikkaus.home != null && (parseFloat(oddsVeikkaus.home) - parseFloat(oddsCalc.home)) > rajoilla) {			
			return "pelattava";	
		}
		else if(column == 'home' && oddsVeikkaus.home != null && parseFloat(oddsVeikkaus.home) > parseFloat(oddsCalc.home)) {			
			return "rajoilla";	
		}
		
		if(column == 'draw' && oddsVeikkaus.draw != null && (parseFloat(oddsVeikkaus.draw) - parseFloat(oddsCalc.draw)) > rajoilla)  {
			return "pelattava";	
		}
		else if(column == 'draw' && oddsVeikkaus.draw != null && parseFloat(oddsVeikkaus.draw) > parseFloat(oddsCalc.draw)) {			
			return "rajoilla";	
		}
		
		if(column == 'visi' && oddsVeikkaus.visi != null && (parseFloat(oddsVeikkaus.visi) - parseFloat(oddsCalc.visi)) > rajoilla) {			
			return "pelattava";
		}
		else if(column == 'visi' && oddsVeikkaus.visi != null && parseFloat(oddsVeikkaus.visi) > parseFloat(oddsCalc.visi)) {			
			return "rajoilla";
		}
		
		return ""
	}
		
	$scope.getClass = function getClass(idx, name) {
		var clazz = "team-cc " + name;
		return clazz;
	}
	
	$scope.getClassDaysGames = function getClass(idx, home, visi) {
		var clazz = "teams-cc " + home + visi;
		return clazz;
	}
		
	$scope.logout = function() {
	
		Logout.logout(function() {
			$window.location.assign('/login');
		});	
	}
});

app.controller('VoimaController', function($scope, $window, TeamsUpdate, Teams, Logout) {
	
	$scope.teamlist = {};
	
	Teams.list(function(teams) {
		$scope.teamlist = teams;
	});
	
	$scope.totalPower = function(){		
			var total = 0;
			var count = 0;
			
			for(count=0;count<$scope.teamlist.length;count++){				
				total += parseFloat($scope.teamlist[count].power);
			}
			return total;
		}
		$scope.editItem = function(index){
			$scope.editing = $scope.teamlist.indexOf(index);   
		}
		
	$scope.saveVoima = function () {
		
		for(i=0;i<$scope.teamlist.length;i++){				
			var team = $scope.teamlist[i];	
			TeamsUpdate.update({id: team._id}, team);		
		}		
	}
	
	$scope.logout = function() {
	
		Logout.logout(function() {
			$window.location.assign('/login');
		});			
	}
});