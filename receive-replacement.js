#!/usr/local/bin/node
    
var config = require('/home/matthew/cs/gititin/config.js');

var join = require('path').join,
    spawn = require(join(config.dirs.src,'spawn.js')),
    email = require(join(config.dirs.src,'email.js')),
    crawl = require(join(config.dirs.src,'crawler.js')).crawl,
    nat = require('nativeUtils');
//Setup error handling. Email me everything that fails.
spawn.setError(function(e){
	email.error(config,['process "',e.proc,
			    '" terminated with code ',e.code,
			    ' and error "',e.err,'"' 
			    ].join(''));
    });
process.on('uncaughtException',function(error){
	email.error(config,JSON.stringify(error));
    });

try {
    process.chdir(config.dirs.tmp);
} catch (err){
    email.error(config,"failed to set pwd");
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
				crawl(repo,function(emails,text){
					spawn.spawn('tar',['-jcvf',repo+'.tar.bz2',repo],function(){
						spawn.spawn('rm',['-rf',repo],function(){
							require(join(config.dirs.src,'email.js')).email({
								config: config,
								    user: user,
								    time: time,
								    repo: repo + '.tar.bz2',
								    cc: emails,
								    body: text
								    },function(){					
								process.exit(0);//The farthest flung point of control flow!
							    });
						    });
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
	email.error(config,'Failed to fork');
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
