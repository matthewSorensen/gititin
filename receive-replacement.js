var fs = require('fs'),
    cp = require('child_process'),
    join = require('path').join;

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
			var sub = cp.fork(join(sourcePath, 'submit.js'));
			sub.on('message',function(){//Once the child is ready, it signals, and we die
				process.exit(0);
			    });
			// Send the relevant data.
			sub.send({workingDir:tempPath,repo: randomName, sourceDir:sourcePath});
		    });
	    });
    });