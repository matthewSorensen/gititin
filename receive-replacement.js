var fs = require('fs'),
    spawn = require('child_process').spawn,
    submit = require('./submit.js').submit;

var tempPath   = '/home/matthew/cs/repos',
    //Probably a much better place/way to create a random file name...
    randomName = 'repo-'+Math.round(100000*Math.random());

try {
    process.chdir(tempPath);
} catch (err){
    console.error("gititin internal error: failed to set pwd");
    process.exit(1);
}
// Make the temporary repository. 
require('fs').mkdir(randomName,'0777',function(){
	spawn('git',['init',randomName,'--bare']).on('exit',function(){
		// Once that's done, invoke 'git receive-pack <new repo>'
		var receive = spawn('git',['receive-pack',randomName]);
		// Route stdout,stdin,stderr to/from git receive-pack
		var stdin = process.openStdin(),
		    link = function (src,dest){ 
		    src.on('data',function(d){dest.write(d)});
		};
		link(receive.stdout,process.stdout);
		link(receive.stderr,process.stderr);
		link(stdin,receive.stdin);
		stdin.on('end',function(){receive.stdin.end();});
		receive.on('exit',function(){
			//After this point, stdout can't be written to.
			submit(randomName);
		    });
	    });
    });