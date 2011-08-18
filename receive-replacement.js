#!/usr/local/bin/node

var tempPath   = '/tmp',
    sourcePath = '/home/matthew/cs/gititin';

var fs = require('fs'),
    join = require('path').join,
    spawn = require(join(sourcePath,'spawn.js')),
    nat = require('nativeUtils');

try {
    process.chdir(tempPath);
} catch (err){
    console.error("gititin internal error: failed to set pwd");
    process.exit(1);
}
// Info that might be relevant in the {future} email module.
var email = {workingDir: tempPath,
	     sourcePath: sourcePath,
	     repo: undefined,
	     user: nat.usernameById(process.getuid()).replace(/\s|[^A-Za-z0-9]/,'')},
    time = new Date();
email.repo = [email.user, time.getMonth()+1, time.getDate(), time.getYear()].join('-');
// Make the temporary repository. 
require('fs').mkdir(email.repo,'0777',function(){
	spawn.spawn('git',['init','--template='+join(sourcePath,'template-repo'),email.repo],function(){
		// Once that's done, invoke 'git receive-pack <new repo>'
		var receive = spawn.old_spawn('git',['receive-pack',email.repo]);
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
				daemonize();
				spawn.spawn('tar',['-zcvf',email.repo+'.tar.gz',email.repo],function(){
					spawn.spawn('rm',['-rf',email.repo],function(){
						//The farthest flung point of control flow!
					    });
				    });
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
    nat.umask(0);
    return nat.setsid();
}
