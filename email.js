var mail = require('emailjs'),
    join = require('path').join,
    fs = require('fs');

var server = (function(server){
	return function(conf){
	    if(server == null)
		server = mail.server.connect(conf);
	    return server;
	};})(null),
    isFailing = false;//Just to stop endless recursion.

function error (conf,error){
    if(!isFailing){
	isFailing = true;
	//We're now safe from an infinite-loop
	var message = mail.message.create({
		from: conf.email.account,
		to:   conf.debug.maintainer,
		subject: 'Gititin failure!',
		text: error
	    });
	server(conf.email).send(message,function(error,message){
		if(error && (error.message || error.error)){
		    // Things got seriously messed up!, so we log and die
		    fs.open(conf.debug.log,'a+',function(err,fd){
			    if(err){//Ok, this isn't funny anymore...
				process.exit(1);
			    }else{
			    var out = new Buffer(JSON.stringify(error)+JSON.stringify(message));
			    fs.write(fd,out,0,out.length,null,function(){
				    fs.close(fd,function(){
					    process.exit(1);
					});
				});
			    }
		    });
		}
	    });
    }
}
exports.error = error;

exports.email = function(opts,cont){
    // Render the email we want to send
    var message = mail.message.create({
	    from:      opts.config.email.account, 
	    to:     opts.config.email.target,
	    subject:   subject(opts),
	    text: ' '
	});
    //message.attach(opts.repo, "application/x-bzip", opts.repo);
    server(opts.config.email).send(message,function(e,message){
	    if(e && (e.message || e.error)){//If the email failed, move it to a safe location
		fs.rename(opts.repo,join(opts.config.dirs.save,opts.repo),function(){
			error(opts.config,[JSON.stringify(e||''),
					   JSON.stringify(message||''),
					   'Tarball saved to "'+
					   join(opts.config.dirs.save,opts.repo)+
					   '"'].join('\n'));
		    });
	    }else{// Delete the repo once it's done
		fs.unlink(opts.repo,cont);
	    }
	});
};

function subject(opts){
    return ['Gititin: ',opts.user,
	    " submitted file '",opts.repo,
	    "' at ", opts.time.toString()].join('');
}
