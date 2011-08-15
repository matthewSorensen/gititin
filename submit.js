var fs = require('fs'),
    spawn = require('child_process').spawn,
    gitteh = require('gitteh');
exports.submit = function (path){
    var fullRepo = path+'-full',
    info = getRepoInfo(path),
    tarball = deriveName(info);
    cloneFullRepo(path,fullRepo,function(){
	    createTarBall(fullRepo,tarball,function(){
		    // This is where we email it, having created the tarball and extracted the relevant info.
		});
	});
};
function cloneFullRepo(origin,dir,cont){
    spawn('git',['clone','-b','master','-l',origin,dir]).on('exit',function(){
	    // We now have the full repo and can kill the original
	    // I would rather not shell-out, but the fs module can't recursively delete dirs...
	    spawn('rm',['-rf',origin]).on('exit',cont);
	});
}
//Matched against all commit messages, to see if someone explicitly set a project name.
var projectPat = /project\s+([a-zA-Z0-9-_]+)/;
// Returns {{<username>:<email>, project:'mabye a string'}
function getRepoInfo(repo){
    // This really needs to get the current username - ssh+ldap gives the only real security
    // unfortunately, we really need this security.
    // async call to id -un should do it.

    var repo = gitteh.openRepository(repo),// This needs to be a bare repo.
	HEAD = repo.getReference("HEAD").resolve(),
	walker = repo.createWalker(),
	ret = {project:'',authors:[]},
	authors = {},
	commit;
    walker.sort(gitteh.GIT_SORT_TIME);
    walker.push(HEAD.target);
    while(commit = walker.next()){
	authors[commit.author.name] = commit.author.email;
	if(commit.message.match(projectPat)){
	    ret.project = RegExp.$1;
	}
    }
    for(var i in authors){
	ret.authors.push({user:i,email:authors[i]});
    }
    return ret;
}
function createTarBall(repo,tarball,cont){
    fs.rename(repo,tarball,function(){
	    spawn('tar',['-zcvf',tarball+'.tar.gz',tarball]).on('exit',function(){
		    spawn('rm',['-rf',tarball]).on('exit',cont);
		});
	});
}
function deriveName(info){
    var oneAuthor = (info.authors.length == 1) && info.authors[0].user.replace(/\s|[^A-Za-z]/,""),
	t = new Date();
    t = ['',t.getMonth()+1, t.getDate(), t.getYear()].join('-');
    return (info.project || oneAuthor || 'unnamed')+t;
}