/*
 * JavaScriptMVC - steal
 * (c) 2008 Jupiter ITS
 * 
 * 
 * This file does the following:
 * 
 * -Checks if the file has already been loaded, if it has, calls steal.end
 * -Defines the MVC namespace.
 * -Defines File
 * -Inspects the DOM for the script tag that steald steal.js, with it extracts:
 *     * the location of steal
 *     * the location of the application directory
 *     * the application's name
 *     * the environment (development, compress, test, production)
 * -Defines steal
 * -Loads more files depending on environment
 *     * Development/Compress -> load the application file
 *     * Test -> Load the test plugin, the application file, and the application's test file
 *     * Production -> Load the application's production file.
 */

//put everything in function to keep space clean
(function(){
    
if(typeof steal != 'undefined' && steal.nodeType)
    throw("Include is defined as function or an element's id!");

var oldsteal = window.steal;


/**
 * @class steal
 * @tag core
 * Steal is used to:
 * <ul>
 *  <li> easily load and compress your application's JavaScript files.  </li>
 *  <li> switch to a different environment [development, test, compress, production]</li>
 * </ul>
 * <h2>Examples</h2>
 * @codestart
 * steal('../../someFolder/somefile');  //steals a JS file relative to the current file
 * steal.plugins('controller','view')   //steals plugins and dependancies
 * steal.models('task')                 //steals files in models folder
 * steal.controller('task')             //steals files in controllers folder
 * steal(function(){                    //runs function after prior steals have finished
 *   steal.views('views/task/init')     //loads a processed view file
 * })
 * @codeend
 * Includes are performed relative to the including file. 
 * Files are steald last-in-first-out after the current file has been loaded and run.
 * <h2>Concat and Compress</h2>
 * In your terminal simply run:
 * @codestart no-highlight
 * js apps\APP_NAME\compress.js
 * @codeend
 * This will generate a production.js bundle in apps\APP_NAME\production.js
 * <h2>Run in production</h2>
 * Switch to the production mode by changing development to production:
 * @codestart no-highlight
 * &lt;script src="<i>PATH/TO/</i>steal/steal.js?APP_NAME,production" type="text/javascript">
 * &lt;/script>
 * @codeend
 * Your application will now only load steal.js and production.js, greatly speeding up load time.
 * <h2>Script Load Order</h2>
 * The load order for your scripts follows a consistent last-in first-out order across all browsers. 
 * This is the same way the following document.write would work in msie, Firefox, or Safari:
 * @codestart
 * document.write('&lt;script type="text/javascript" src="some_script.js"></script>')
 * @codeend
 * An example helps illustrate this.<br/>
 * <img src='http://wiki.javascriptmvc.com/images/last_in_first_out.png'/>
 * <table class="options">
                <tr class="top">
                    <th>Load Order</th>
                    <th class="right">File</th>
                </tr>
                <tbody>
                <tr>
                    <td>1</td>
                    <td class="right">1.js</td>
                </tr>
                <tr>
                    <td>2</td>
                    <td class="right">3.js</td>
                </tr>
                <tr>
                    <td>3</td>
                    <td class="right">4.js</td>
                </tr>
                <tr>
                    <td>4</td>
                    <td class="right">2.js</td>
                </tr>
                <tr>
                    <td>5</td>
                    <td class="right">5.js</td>
                </tr>
                <tr class="bottom">
                    <td>6</td>
                    <td class="right">6.js</td>
                </tr>
    </tbody></table>
 */
steal = function(){
    for(var i=0; i < arguments.length; i++) 
        steal.add(  new steal.fn.init(arguments[i]) );


    return steal;
};
var id = 0;
/* @prototype */
steal.fn = steal.prototype = {
    /**
     * Queues a file to be loaded or an steal callback to be run.  This takes the same arguments as [steal].
     * @param {String|Object|Function} options 
     * <table class='options'>
     *     <tr>
     *         <th>Type</th><th>Description</th>
     *     </tr>
     *     <tr><td>String</td><td>A relative path to a JavaScript file.  The path can optionally end in '.js'</td></tr>
     *     <tr><td>Object</td>
     *     <td>An Object with the following properties:
     *         <ul>
     *             <li>path {String} - relative path to a JavaScript file.  </li>
     *             <li>process {optional:Function} - Function that will process steal in compress mode</li>
     *             <li>skipInsert {optional:Boolean} - Include not added as script tag</li>
     *             <li>compress {optional:Boolean} - false if you don't want to compress script</li>
     *         </ul>
     *     </td></tr>
     *     <tr><td>Function</td><td>A function to run after all the prior steals have finished loading</td></tr>
     * </table>
     * @return {steal} a new steal object
     */
    init : function(options){
        this.id = (++id)
		if(typeof options == 'function'){
            var path = steal.getPath();
            this.func = function(){
                steal.setPath(path);
                options(window.jQuery); //should return what was steald before 'then'
            };
            this.options = options;
        } else if(options.type) { 
            
			this.path = options.src;
            this.type = options.type;
        } else { //something we are going to steal and run
            
            if(typeof options == 'string' ){
                this.path = options.indexOf('.js') == -1  ? options+'.js' : options
            }else {
                extend( this, options)
            }
            this.originalPath = this.path;
            //get actual path
            var pathFile = new File(this.path);
            this.path = pathFile.normalize();
            this.absolute = pathFile.relative() ? pathFile.joinFrom(steal.getAbsolutePath(), true) : this.path;
            this.dir = new File(this.path).dir();
        }
        
    },
    /**
     * Adds a script tag to the dom, loading and running the steal's JavaScript file.
     * @hide
     */
    run : function(){
        steal.current = this;
		var isProduction = (steal.options.env == "production");
		if(this.func){
            //run function and continue to next steald
            this.func();
            steal.end();
			//insert();
        }else if(this.type){
			isProduction ? true : insert(this.path, "text/" + this.type);
			
        }else{
            if( steal.options.env == 'compress'){
                this.setSrc();
            }else if(isProduction){
				 return;
			}
            steal.setPath(this.dir);
              this.skipInsert ? insert() : insert(this.path);
        }
    },
    /**
     * Loads the steal code immediately.  This is typically used after DOM has loaded.
     * @hide
     */
    runNow : function(){
        steal.setPath(this.dir);
        
        return browser.rhino ? load(this.path) : 
                    steal.insert_head( steal.root.join(this.path) );
    },
    /**
     * Sets the src property for an steal.  This is used by compression.
     * @hide
     */
    setSrc : function(){
        if(steal.options.debug){
            var parts = this.path.split("/")
            if(parts.length > 4) parts = parts.slice(parts.length - 4);
            print("   "+parts.join("/"));
        }
        this.src = steal.request(steal.root.join(this.path));
    }
    
}
steal.fn.init.prototype = steal.fn;


var extend = function(d, s) { for (var p in s) d[p] = s[p]; return d;},
    getLastPart = function(p){ return p.match(/[^\/]+$/)[0]};
steal.extend = extend;
var browser = {
        msie:     !!(window.attachEvent && !window.opera),
        opera:  !!window.opera,
        safari: navigator.userAgent.indexOf('AppleWebKit/') > -1,
        firefox:  navigator.userAgent.indexOf('Gecko') > -1 && navigator.userAgent.indexOf('KHTML') == -1,
        mobilesafari: !!navigator.userAgent.match(/Apple.*Mobile.*Safari/),
        rhino : navigator.userAgent.match(/Rhino/) && true
    }
    steal.browser = browser;
var random = ""+parseInt(Math.random()*100)


steal.root = null;
steal.pageDir = null;


var factory = function(){ return window.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();};



/**
 * @Constructor
 * Used for getting information out of a path
 * @init
 * Takes a path
 * @param {String} path 
 */
steal.File = function(path){ this.path = path; };
var File = steal.File;
File.prototype = 
/* @prototype */
{
    /**
     * Removes hash and params
     * @return {String}
     */
    clean: function(){
        return this.path.match(/([^\?#]*)/)[1];
    },
    /**
     * Returns everything before the last /
     */
    dir: function(){
        var last = this.clean().lastIndexOf('/');
        return last != -1 ? this.clean().substring(0,last) : ''; //this.clean();
    },
    /**
     * Returns the domain for the current path.
     * Returns null if the domain is a file.
     */
    domain: function(){ 
        if(this.path.indexOf('file:') == 0 ) return null;
        var http = this.path.match(/^(?:https?:\/\/)([^\/]*)/);
        return http ? http[1] : null;
    },
    protocol : function(){
          return this.path.match( /^(https?:|file:)/ )[1]
    },
    /**
     * Joins url onto path
     * @param {Object} url
     */
    join: function(url){
        return new File(url).joinFrom(this.path);
    },
    /**
     * Returns the path of this file referenced form another url.
     * @codestart
     * new steal.File('a/b.c').joinFrom('/d/e')//-> /d/e/a/b.c
     * @codeend
     * @param {Object} url
     * @param {Object} expand
     * @return {String} 
     */
    joinFrom: function( url, expand){
        if(this.isDomainAbsolute()){
            var u = new File(url);
            if(this.domain() && this.domain() == u.domain() ) 
                return this.after_domain();
            else if(this.domain() == u.domain()) { // we are from a file
                return this.to_reference_from_same_domain(url);
            }else
                return this.path;
        }else if(url == steal.pageDir && !expand){
            return this.path;
        }else if(this.isLocalAbsolute()){
            var u = new File(url);
            if(!u.domain()) return this.path;
            return u.protocol()+"//"+u.domain() + this.path;
        }
        else{
            
            if(url == '') return this.path.replace(/\/$/,'');
            var urls = url.split('/'), paths = this.path.split('/'), path = paths[0];
            if(url.match(/\/$/) ) urls.pop();
            while(path == '..' && paths.length > 0){
                paths.shift();
                urls.pop();
                path =paths[0];
            }
            return urls.concat(paths).join('/');
        }
    },
    /**
     * Joins the file to the current working directory.
     */
    join_current: function(){
        return this.joinFrom(steal.getPath());
    },
    /**
     * Returns true if the file is relative
     */
    relative: function(){        return this.path.match(/^(https?:|file:|\/)/) == null;},
    /**
     * Returns the part of the path that is after the domain part
     */
    after_domain: function(){    return this.path.match(/(?:https?:\/\/[^\/]*)(.*)/)[1];},
    /**
     * 
     * @param {Object} url
     */
    to_reference_from_same_domain: function(url){
        var parts = this.path.split('/'), other_parts = url.split('/'), result = '';
        while(parts.length > 0 && other_parts.length >0 && parts[0] == other_parts[0]){
            parts.shift(); other_parts.shift();
        }
        for(var i = 0; i< other_parts.length; i++) result += '../';
        return result+ parts.join('/');
    },
    /**
     * Is the file on the same domain as our page.
     */
    is_cross_domain : function(){
        if(this.isLocalAbsolute()) return false;
        return this.domain() != new File(window.location.href).domain();
    },
    isLocalAbsolute : function(){    return this.path.indexOf('/') === 0},
    isDomainAbsolute : function(){return this.path.match(/^(https?:|file:)/) != null},
    /**
     * For a given path, a given working directory, and file location, update the path so 
     * it points to the right location.
     * This should probably folded under joinFrom
     */
    normalize: function(){
        var current_path = steal.getPath();
        //if you are cross domain from the page, and providing a path that doesn't have an domain
        var path = this.path;
        if (this.isCurrentCrossDomain() && !this.isDomainAbsolute()) {
			//if the path starts with /
			path = this.isLocalAbsolute() ? 
				current_path.split('/').slice(0, 3).join('/') + path :
				this.joinFrom(current_path);
		}
		else if (current_path != '' && this.relative()) {
			path = this.joinFrom(current_path + (current_path.lastIndexOf('/') === current_path.length - 1 ? '' : '/'));
		}
		else if (/^\/\//.test(this.path)) {
			path = this.path.substr(2);
		}
        return path;
    },
	isCurrentCrossDomain : function(){
		return new File(steal.getAbsolutePath()).is_cross_domain();
	}
};
/**
 *  @add steal
 */
// break
/* @static */
//break
/**
 * @attribute pageDir
 * The current page's folder's path.
 */
steal.pageDir = new File(window.location.href).dir();

//find steal


/**
 * @attribute options
 * Options that deal with steal
 * <table class='options'>
     *     <tr>
     *         <th>Option</th><th>Default</th><th>Description</th>
     *     </tr>
     *     <tr><td>env</td><td>development</td><td>Which environment is currently running</td></tr>
     *     <tr><td>encoding</td><td>utf-8</td><td>What encoding to use for script loading</td></tr>
     *     <tr><td>cacheInclude</td><td>true</td><td>true if you want to let browser determine if it should cache script; false will always load script</td></tr>
     *     <tr><td>debug</td><td>true</td><td>turns on debug support</td></tr>
     *     <tr><td>done</td><td>null</td><td>If a function is present, calls function when all steals have been loaded</td></tr>
     *     <tr><td>documentLocation</td><td>null</td><td>If present, ajax request will reference this instead of the current window location.  
     *     Set this in run_unit, to force unit tests to use a real server for ajax requests. </td></tr>
     *     <tr><td>startFile</td><td>null</td><td>This is the first file to load.  It is typically determined from the first script option parameter 
     *     in the inclue script. </td></tr>
     * </table>
 * 
 * 
 */
steal.options = {
    loadProduction: true,
    env: 'development',
    production:null,
    encoding : "utf-8",
    cacheInclude : true,
    debug: true
}





// variables used while including
var first = true ,                                 //If we haven't steald a file yet
    first_wave_done = false,                       //If all files have been steald 
    steald_paths = [],                           //a list of all steald paths
    cwd = '',                                      //where we are currently including
    steals=[],                                   //    
    current_steals=[],                           //steals that are pending to be steald
    total = [];                                    //







extend(steal,
{
    /**
     * Sets options from script
     * @hide
     */
    setScriptOptions : function(){
        var scripts = document.getElementsByTagName("script"), scriptOptions;
        for(var i=0; i<scripts.length; i++) {
            var src = scripts[i].src;
            if(src && src.match(/steal\.js/)){  //if script has steal.js
                var mvc_root = new File( new File(src).joinFrom( steal.pageDir ) ).dir();
                var loc = mvc_root.match(/\.\.$/) ?  mvc_root+'/..' : mvc_root.replace(/steal$/,'');
                if(loc.match(/.+\/$/)) loc = loc.replace(/\/$/, '');
                steal.root = new File(loc);
                if(src.indexOf('?') != -1) scriptOptions = src.split('?')[1];
            }
        
        }
        
        if(scriptOptions){
            scriptOptions.replace(/steal\[([^\]]+)\]=([^&]+)/g, function(whoe, prop, val){ 
                steal.options[prop] = val;
            })
        }
        
    },
    setOldIncludeOptions : function(){
        extend(steal.options, oldsteal);
    },
    setHashOptions : function(){
        window.location.hash.replace(/steal\[(\w+)\]=(\w+)/g, function(whoe, prop, val){ 
            steal.options[prop] = val;
        })
    },
    /**
     * Starts including files, sets options.
     * @hide
     */
    init: function(){
        this.setScriptOptions();
        this.setOldIncludeOptions();
        this.setHashOptions();
        //clean up any options
        if(steal.options.app){
            steal.options.startFile = steal.options.app+"/"+steal.options.app.match(/[^\/]+$/)[0]+".js"
        }
        
        
        if(!steal.options.production && steal.options.startFile){
            steal.options.production = steal.root.join(  new File(steal.options.startFile).dir()+ '/production')

        }
        if(steal.options.production)
            steal.options.production = steal.options.production+(steal.options.production.indexOf('.js') == -1 ? '.js' : '' );
        
        //start loading stuff
        //steal.plugins('jquery'); //always load jQuery
        
        //if you have a startFile load it
        if(steal.options.startFile){
            first = false; //makes it so we call close after
            steal(steal.options.startFile);
        }
        if(steal.options.env == 'test')  {
            steal.plugins('test');
            if(steal.options.documentLocation) 
                steal.plugins('dom/fixtures/overwrite');
            if(steal.options.startFile){ //load test file in same directory
                 steal( new File(steal.options.startFile).dir()+"/test/unit.js");
            }
        }
        if(steal.options.env == 'compress'){
            steal.plugin({path: 'util/compress', ignore: true}) //should get ignored
        }
        if(steal.options.env == 'production' && steal.options.loadProduction){
            document.write('<script type="text/javascript" src="'+steal.options.production+'"></script>' );
            return
        }
            
            
        if(steal.options.startFile) steal.start();
    },
    /**
     * Sets the current directory.
     * @param {String} p the new directory which relative paths reference
     */
    setPath: function(p) {
        cwd = p;
    },
    /**
     * Gets the current directory your relative steals will reference.
     * @return {String} the path of the current directory.
     */
    getPath: function() { 
        return cwd;
    },
    getAbsolutePath: function(){
        var fwd = new File(cwd);
        return fwd.relative() ? fwd.joinFrom(steal.root.path, true) : cwd;
    },
    // Adds an steal to the pending list of steals.
    add: function(newInclude){
        //If steal is a function, add to list, and unshift
		if(typeof newInclude.func == 'function'){
            steal.functions.push(newInclude); //add to the list of functions
            current_steals.unshift(  newInclude ); //add to the front
            return;
        }
        
        //if we have already performed loads, insert new steals in head
        

        //now we should check if it has already been steald or added earlier in this file
        if(steal.should_add(newInclude)){
            if(first_wave_done) {
                return newInclude.runNow();
            }
            //but the file could still be in the list of steals but we need it earlier, so remove it and add it here
            var path = newInclude.absolute || newInclude.path;
			for(var i = 0; i < steals.length; i++){
                if(steals[i].absolute == path){
                    steals.splice(i,1);
                    break;
                }
            } 
            current_steals.unshift(  newInclude );
        }
    },
    //
    should_add : function(inc){
		var path = inc.absolute || inc.path;
        for(var i = 0; i < total.length; i++) if(total[i].absolute == path) return false;
        for(var i = 0; i < current_steals.length; i++) if(current_steals[i].absolute == path) return false;
        return true;
    },
    done : function(){
        if (typeof steal.options.done == "function") steal.options.done(total);
    },
    // Called after every file is loaded.  Gets the next file and steals it.
    end: function(src){
        // add steals that were just added to the end of the list
		var got = current_steals.length;
		steals = steals.concat(current_steals);
        // take the last one
		var next = steals.pop();
        
        // if there are no more
        if(!next) {
            first_wave_done = true;
            steal.done();
        }else{
            //add to the total list of things that have been steald, and clear current steals
            total.push( next);
            current_steals = [];
            next.run();
        }
        
    },
    //steal.end_of_production is written at the end of the production script to call this function
    end_of_production: function(){ first_wave_done = true;steal.done(); },
    
    /**
     * Starts loading files.  This is useful when steal is being used without providing an initial file or app to load.
     * You can steal files, but then call steal.start() to start actually loading them.
     * 
     * <h3>Example:</h3>
     * @codestart html
     * &lt;script src='steal/steal.js'>&lt;/script>
     * &lt;script type='text/javascript'>
     *    steal.plugins('controller')
     *    steal.start();
     * &lt;/script>
     * @codeend
     * The above code loads steal, then uses steal to load the plugin controller.
     */
    start: function(){
        steal.start_called = true;
            if (steal.options.env != 'production')
                steal.end();
    },
    start_called : false,
    functions: [],
    next_function : function(){
        var func = steal.functions.pop();
        if(func) func.func();
    },
    /**
     * Includes CSS from the stylesheets directory.
     * @param {String} css the css file's name to load, steal will add .css.
     */
    css: function(){
        var arg;
        for(var i=0; i < arguments.length; i++){
            arg = arguments[i];
            steal.css_rel('../../stylesheets/'+arg);
        }
    },
    /**
     * Creates css links from the given relative path.
     * @hide
     * @param {String} relative URL(s) to stylesheets
     */
    css_rel: function(){
        var arg;
        for(var i=0; i < arguments.length; i++){
            arg = arguments[i];
            var current = new File(arg+".css").join_current();
            steal.create_link( steal.root.join(current)  );
        }
    },
    /**
     * Creates a css link and appends it to head.
     * @hide
     * @param {Object} location
     */
    create_link: function(location){
        var link = document.createElement('link');
        link.rel = "stylesheet";
        link.href =  location;
        link.type = 'text/css';
        head().appendChild(link);
    },
    /**
     * Synchronously requests a file.
     * @param {String} path path of file you want to load
     * @param {optional:String} content_type optional content type
     * @return {String} text of file
     */
    request: function(path, content_type){
       var contentType = content_type || "application/x-www-form-urlencoded; charset="+steal.options.encoding
       var request = factory();
       request.open("GET", path, false);
       request.setRequestHeader('Content-type', contentType)
       if(request.overrideMimeType) request.overrideMimeType(contentType);

       try{request.send(null);}
       catch(e){return null;}
       if ( request.status == 500 || request.status == 404 || request.status == 2 ||(request.status == 0 && request.responseText == '') ) return null;
       return request.responseText;
    },
    /**
     * Inserts a script tag in head with the encoding.
     * @hide
     * @param {Object} src
     * @param {Object} encode
     */
    insert_head: function(src, encode, type, text, id){
        encode = encode || "UTF-8";
        var script= script_tag();
        src && (script.src= src);
        script.charset= encode;
		script.type = type ||"text/javascript"
		id && (script.id = id);
		text && (script.text = text);
        head().appendChild(script);
    },
    write : function(src, encode){
        encode = encode || "UTF-8";
        document.write('<script type="text/javascript" src="'+src+'" encode="+encode+"></script>');
    },
    resetApp : function(f){
        return function(name){
            var current_path = steal.getPath();
            steal.setPath("");
            if(name.path){
                name.path = f(name.path)
            }else{
                name = f(name)
            }
            steal(name);
            steal.setPath(current_path);
            return steal;
        }
    },
    callOnArgs : function(f){
        return function(){
            for(var i=0; i < arguments.length; i++) f(arguments[i]);
            return steal;
        }
        
    },
    // Returns a function that applies a function to a list of arguments.  Then steals those
    // arguments.
    applier: function(f){
        return function(){
            for (var i = 0; i < arguments.length; i++) {
                arguments[i] = f(arguments[i]);
            }
            steal.apply(null, arguments);
            return steal;
        }
    },
    log : function(){
        $('#log').append(jQuery.makeArray(arguments).join(", ")+"<br/>")
    },
    then : steal,
    total: total
});
steal.app = steal.resetApp(function(p){return p+'/'+getLastPart(p)})
steal.plugin = steal.resetApp(function(p){return p+'/'+getLastPart(p)})
/**
 * @function plugins
 * Loads a list of plugins in /steal/plugins
 * @param {String} plugin_location location of a plugin, ex: dom/history.
 */
steal.apps = steal.callOnArgs(steal.app);
steal.plugins = steal.callOnArgs(steal.plugin);
steal.engine = steal.resetApp(function(p){
    var parts = p.split("/");
    if(!parts[1])parts[1] = parts[0];
    return 'engines/'+ parts[0]+'/apps/'+parts[1]+"/init.js"
});
/**
 * @function engines
 * Includes engines by name.  Engines are entire MVC stacks in the engines directory.
 * @param {String} engine_name If there are no '/'s, steal will load 
 *     'engines/<i>engine_name</i>/apps/<i>engine_name</i>/init.js'; if engine_name looks like: 'engine/part' it will load
 *     'engines/<i>engine</i>/apps/<i>part</i>/init.js'.
 */
steal.engines = steal.callOnArgs(steal.engine);

/**
 * @function controllers
 * Includes controllers from the controllers directory.  Will add _controller.js to each name passed in.
 * @param {String} controller_name A controller to steal.  "_controller.js" is added to the name provided.
 */
steal.controllers = steal.applier(function(i){
    if (i.match(/^\/\//)) {
        i = steal.root.join( i.substr(2) )
        return i;
    }
    return 'controllers/'+i+'_controller';
});

/**
 * @function models
 * Includes files in the /models directory.
 * @param {String} model_name the name of the model file you want to load.
 */
steal.models = steal.applier(function(i){
    if (i.match(/^\/\//)) {
        i = steal.root.join( i.substr(2) )
        return i;
    }
    return 'models/'+i;
});
 
/**
 * @function resources
 * Includes a list of files in the <b>/resources</b> directory.
 * @param {String} resource_path resource you want to load.
 */
steal.resources = steal.applier(function(i){
    if (i.match(/^\/\//)) {
        i = steal.root.join( i.substr(2) )
        return i;
    }
    return 'resources/'+i;
});

/**
 * @function views
 * Includes a list of files in the <b>/views</b> directory.
 * @param {String} view_path view you want to load.
 */
steal.views = function(){
	for(var i=0; i< arguments.length; i++){	
		steal.view(arguments[i])
    }
	return steal;
};


steal.view = function(path){
    var type = path.match(/\.\w+$/gi)[0].replace(".","");
	//print(path+" --!")
	steal({src: path, type: type});    
	return steal;
};

var script_tag = function(){
    var start = document.createElement('script');
    start.type = 'text/javascript';
    return start;
};

var insert = function(src, type, onlyInsert){
    // source we need to know how to get to steal, then load 
    // relative to path to steal
	
	
	if(src){
        var id = src.replace(/[\/\.]/g,"_")
		var src_file = new File(src);
        if(!src_file.isLocalAbsolute() && !src_file.isDomainAbsolute())
            src = steal.root.join(src);
		
    }
	var text = "", writeSrc = true;
	if(type && type != 'test/javascript' && !browser.rhino){
		text = steal.request(src);
		if(!text)
			throw "you got nothing at "+src;
		writeSrc = false
	}

    var scriptTag = '<script type="'+((typeof type!='undefined')?(type+'" '):'text/javascript" ');
    if(writeSrc)
		scriptTag += src?('src="'+src+'" '):'';
    scriptTag += src?('id="'+id+'" '):'';
    scriptTag += 'compress="'+((typeof steal.current['compress']!='undefined')?
        (steal.current['compress']+'" '):'true" ');
    scriptTag += 'package="'+((typeof steal.current['package']!='undefined')?
        (steal.current['package']+'">'):'production.js">');    
	if(text)
		scriptTag += text;
    scriptTag += '</script>'; 

    document.write(
        (src? scriptTag : '') + (onlyInsert ? "" : call_end())
    );

};

var call_end = function(src){
    return !browser.msie ? '<script type="text/javascript">steal.end();</script>' : 
    '<script type="text/javascript" src="'+steal.root.join('steal/end.js')+'"></script>'
}

var head = function(){
    var d = document, de = d.documentElement;
    var heads = d.getElementsByTagName("head");
    if(heads.length > 0 ) return heads[0];
    var head = d.createElement('head');
    de.insertBefore(head, de.firstChild);
    return head;
};



steal.init();
})();

