if(typeof steal == "undefined") 
	steal = {};
;
(function(){
	
	var extend = function(d, s){
		for(var n in s){
			d[n] = s[n]
		}
	}
	steal.extend = extend;
	if(!steal.File){
		steal.File = function(path){
			this.path = path;
		}
	}


extend(steal.File.prototype, {	
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
		return new steal.File(url).joinFrom(this.path);
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
			var u = new steal.File(url);
			if(this.domain() && this.domain() == u.domain() ) 
				return this.after_domain();
			else if(this.domain() == u.domain()) { // we are from a file
				return this.to_reference_from_same_domain(url);
			}else
				return this.path;
		}else if(this.isLocalAbsolute()){
            var u = new steal.File(url);
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
     * Returns true if the file is relative
     */
	relative: function(){		return this.path.match(/^(https?:|file:|\/)/) == null;},
    /**
     * Returns the part of the path that is after the domain part
     */
	after_domain: function(){	return this.path.match(/(?:https?:\/\/[^\/]*)(.*)/)[1];},
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
		return this.domain() != new steal.File(location.href).domain();
	},
	isLocalAbsolute : function(){	return this.path.indexOf('/') === 0},
	isDomainAbsolute : function(){return this.path.match(/^(https?:|file:)/) != null},
    /**
     * For a given path, a given working directory, and file location, update the path so 
     * it points to the right location.
     */

	
	mkdir: function(){
        var out = new java.io.File( this.path )
        out.mkdir();
    },
    mkdirs: function(){
        var out = new java.io.File( this.path )
        out.mkdirs();
    },
    exists: function(){
        var exists = (new java.io.File(this.path)).exists();
        return exists;
    },
    copy_to: function(dest){
        var fin = new java.io.FileInputStream(new java.io.File( this.path ));
        var fout = new java.io.FileOutputStream(new java.io.File(dest));
    
        // Transfer bytes from in to out
        var data = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 1024);
        var len = 0;
        while ((len = fin.read(data)) > 0) {
            fout.write(data, 0, len);
        }
        fin.close();
        fout.close();
    },
    save: function(src, encoding){
          var fout = new java.io.FileOutputStream(new java.io.File( this.path ));
    
          var out     = new java.io.OutputStreamWriter(fout, "UTF-8");
          var s = new java.lang.String(src || "");
        
          var text = new java.lang.String( (s).getBytes(), encoding || "UTF-8" );
        		out.write( text, 0, text.length() );
        		out.flush();
        		out.close();
    },
    download_from: function(address){
       var input = 
           new java.io.BufferedInputStream(
               new java.net.URL(address).openStream()
           );
           
        bout = new java.io.BufferedOutputStream(
                new java.io.FileOutputStream(this.path),
                1024
            );
        var data = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 1024);
        var num_read = 0;
        while( (num_read = input.read(data,0,1024) ) >= 0    ) {
            bout.write(data, 0 , num_read);
        }
        bout.close();
    },
    basename: function(){
        return this.path.match(/\/?([^\/]*)\/?$/)[1];
    }
});

steal.File.cwdURL = function(){
    return new java.io.File("").toURL().toString();
}
steal.File.cwd = function(){
    return String(new java.io.File('').getAbsoluteFile().toString());
}
	
	
})();

