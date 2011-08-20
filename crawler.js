var git = require('gitteh'),
    join = require('path').join;

//Gets a list of all committers, and could possibly contribute to the email text.
exports.crawl = function(repo,cont){
    var repo = git.openRepository(join(repo,'.git')),// This needs to be a bare repo.
    HEAD = repo.getReference("HEAD").resolve(),
    walker = repo.createWalker(),
    authors = {},
    commit;
    walker.sort(git.GIT_SORT_TIME);
    walker.push(HEAD.target);
    while(commit = walker.next()){
	authors[commit.author.name] = commit.author.email;
    }
    var emails = [];
    for(var i in authors){
	emails.push(authors[i]);
    }
    cont(emails,'');//Second parameter is for a possible
};