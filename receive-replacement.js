#!/usr/local/bin/node

var config = require('/home/matthew/cs/gititin/config.js');

var join = require('path').join,
    spawn = require(join(config.dirs.src,'spawn.js')),
    nat = require('nativeUtils');

try {
    process.chdir(config.dirs.tmp);
} catch (err){
    console.error("gititin internal error: failed to set pwd");
    process.exit(1);
}

var user = nat.usernameById(process.getuid()),
    time = new Date(),
    repo = [user.replace(/\s|[^A-Za-z0-9]/,''), time.getMonth()+1, time.getDate(), time.getYear()].join('-');

require('fs').mkdir(repo,'0777',function(){
	spawn.spawn('git',['init','--template='+config.dirs.template,repo],function(){
		// Once that's done, invoke 'git receive-pack <new repo>'
		var receive = spawn.old_spawn('git',['receive-pack',repo]);
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
				spawn.spawn('tar',['-zcvf',repo+'.tar.gz',repo],function(){
					spawn.spawn('rm',['-rf',repo],function(){
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
