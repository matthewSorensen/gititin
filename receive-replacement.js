var fs = require('fs'),
    cp = require('child_process'),
    join = require('path').join,
    nat = require('nativeUtils');
var tempPath   = '/home/matthew/cs/repos',
    sourcePath = '/home/matthew/cs/gititin',
    randomName = 'repo-'+Math.round(100000*Math.random());
try {
    process.chdir(tempPath);
} catch (err){
    console.error("gititin internal error: failed to set pwd");
    process.exit(1);
}
// Make the temporary repository. 
require('fs').mkdir(randomName,'0777',function(){
	cp.spawn('git',['init',randomName,'--bare']).on('exit',function(){
		// Once that's done, invoke 'git receive-pack <new repo>'
		var receive = cp.spawn('git',['receive-pack',randomName]);
		// Route stdout,stdin,stderr to/from git receive-pack
		process.stdin.resume();
		receive.stdout.pipe(process.stdout);
		receive.stderr.pipe(process.stderr);
		process.stdin.pipe(receive.stdin);
		
		receive.on('exit',function(){
			// Once the real git receive-pack has terminated, the replacement probably should.
			// However, there's still work to do, so we fork a child, which daemonizes itself once it's got the data.
			fork(function(){
				process.exit(0);
			    },function(){
				var opts = {workingDir: tempPath, 
					    repo: randomName, 
					    sourceDir: sourcePath,
					    user: nat.usernameById(process.getuid())
				};
				daemonize();
				require(join(sourcePath,'submit.js')).submit(opts);
			    });
		    });
	    });
    });
function fork(parent,child){
    var pid = nat.fork();
    if(pid == 0){
	child();
    }else if(pid < 0){
	console.error('Failed to fork');
	process.exit(1);
    }else{
	parent();
    }
}
// Detatch std{in,out,err}, chdir, umask, then start a new process group.                                                                                  
function daemonize(dir){
    process.stdin.destroy();
    process.stdout.end();
    process.stderr.end();
    process.umask('0111');//This is absolutely needed, but shouldn't be...
    return nat.setsid();
}