var fs = require('fs'),
    spawn = undefined;
exports.submit = function(opts){
    var fullRepo = opts.repo + '-full',
    tarball = tarName(opts.user);
    spawn = require(require('path').join(opts.sourceDir,'spawn.js')).spawn;
    fs.rename(fullRepo,tarball,function(){
	    spawn('rm',['-rf',opts.repo],function(){
		    createTarBall(tarball,function(){
			    process.exit(0);
			});
		});
	});
};
function tarName(user){
    var t = new Date();
    user = user.replace(/\s|[^A-Za-z0-9]/,'');
    return [user, t.getMonth()+1, t.getDate(), t.getYear()].join('-');
}

function createTarBall(tarball,cont){
    spawn('tar',['-zcvf',tarball+'.tar.gz',tarball],function(){
	    spawn('rm',['-rf',tarball],cont);
	});
}    