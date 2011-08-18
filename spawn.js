var handler = function(){},
    spawn = require('child_process').spawn;

exports.setError = function(nHandler){
    handler = nHandler;
};

exports.spawn = function(cmd,args,cont){
    var buffer = '',
    proc = spawn(cmd,args);
    proc.stderr.on('data',function(d){buffer = buffer + d;});
    proc.stdout.on('data',function(_){;});
    proc.on('exit',function(code,_){// This is for internal use, so we aren't bothering to catch killed procs.
	    if(code != 0){
		handler({err:buffer,code:code,proc:cmd,args:args});
	    }else{
		cont();
	    }
	});
};

exports.old_spawn = spawn;