var fs = require('fs'),
    spawn = require('child_process').spawn;
exports.submit = function(opts){
    var fullRepo = opts.repo + '-full',
    tarball = tarName(opts.user);
    cloneFullRepo(opts.repo,fullRepo,function(){
	    createTarBall(fullRepo,tarball,function(){
		    process.exit(0);
		});
	});
};
function tarName(user){
    var t = new Date();
    user = user.replace(/\s|[^A-Za-z0-9]/,'');
    return [user, t.getMonth()+1, t.getDate(), t.getYear()].join('-');
}
function cloneFullRepo(origin,dir,cont){
    spawn('git',['clone','-b','master','-l',origin,dir]).on('exit',function(){
	    // We now have the full repo and can kill the original
	    // I would rather not shell-out, but the fs module can't recursively delete dirs...
	    spawn('rm',['-rf',origin]).on('exit',cont);
	});
}
function createTarBall(repo,tarball,cont){
    fs.renameSync(repo,tarball);
    spawn('tar',['-zcvf',tarball+'.tar.gz',tarball]).on('exit',function(){
	    spawn('rm',['-rf',tarball]).on('exit',cont);
	});
}    