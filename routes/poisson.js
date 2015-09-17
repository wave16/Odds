function Poisson(){};

Poisson.poisson = function(m) {
	var mean = m;				
	var L = Math.exp(-mean);
	var p = 1.0;
	var k = 0;
	do {
		k++;
		p *= Math.random();
	} while (p > L);				
	return k - 1;				
};
			
Poisson.probability = function(x, X) {
				
	var pct = 0;				
	var dist = [];
				
	for (i = 0; i < 100000; i++) { 
		dist.push(Poisson.poisson(X));
	}
				
	for (i = 0; i < dist.length; i++) { 
		if (dist[i] <= x) {
			pct++;
		}
	}
				
	return pct/100000;
};

module.exports = Poisson;