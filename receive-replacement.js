function link(src,dest){ 
    src.on('data',function(d){dest.write(d)});
}
var fs = require('fs'),
    spawn = require('child_process').spawn;
var repoPath = '/home/matthew/cs/repos',
//Probably a much better place/way to create this!
    randomName = 'repo-'+Math.round(1000*Math.random());

process.chdir(repoPath);

//syncronously make the new repository
fs.mkdirSync(randomName,'0777');
var init = spawn('git',['init',randomName,'--bare']);
init.on('exit',function(){
	// Once that's done, invoke 'git receive-pack <new repo>'
	var receive = spawn('git',['receive-pack',randomName]);
	// Link all of the streams:
	var stdin = process.openStdin();
	link(receive.stdout,process.stdout);
	link(receive.stderr,process.stderr);
	link(stdin,receive.stdin);
	stdin.on('end',function(){receive.stdin.end();});
	receive.on('exit',function(){
		//After this point, stdout can't be written to.
		require('./submit.js').submit(randomName);
	    });
    });


