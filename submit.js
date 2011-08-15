var fs = require('fs'),
    spawn = require('child_process').spawn,
    gitteh = require('gitteh');
// Clone the repo somewhere
// Format the git info as pretty as possible
// Clean stuff up and then tar.gz it!
// Then email! 

exports.submit = function (path){
    var fullRepo = path+'-full',
    info = getRepoInfo(path),
    tarball = deriveName(info);
    cloneFullRepo(path,fullRepo,function(){
	    createTarBall(fullRepo,tarball,function(){
		    // This is where we email it.
		    //	    console.log("DONE!");
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
var projectPat = /git-([a-z]+)/;  // /\{\{([^}]*)\}\}/;
// Returns {{<username>:<email>, project:'mabye a string'}
function getRepoInfo(repo){
    var repo = gitteh.openRepository(repo),// This needs to be a bare repo.
	HEAD = repo.getReference("HEAD").resolve(),
	walker = repo.createWalker(),
	ret = {authors:{},project:''},
	commit;
    walker.sort(gitteh.GIT_SORT_TIME);
    walker.push(HEAD.target);
    while(commit = walker.next()){
	ret.authors[commit.author.name] = commit.author.email;
	if(commit.message.match(projectPat)){
	    ret.project = RegExp.$1;
	}
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
    return 'project-name-author';
}

// Make people set the project name with git note!
// Get names from commit messages

