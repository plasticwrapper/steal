rhinoLoader = function( func, fireLoad){
	rhinoLoader.callback =func;
    load('steal/rhino/env.rhino.js');
	Envjs('steal/rhino/empty.html', {scriptTypes : {"text/javascript" : true,"text/envjs" : true}, fireLoad: fireLoad, logLevel: 2});
}



