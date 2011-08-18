var mail = require('emailjs'),
    join = require('path').join;

exports.email = function(opts,cont){
    // Render the email we want to send
    var server = mail.server.connect(opts.config.email),
    message = mail.message.create({
	    from:      opts.config.email.account, 
	    to:     opts.config.email.target,
	    subject:   subject(opts),
	    text: 'message body'
	});
    message.attach(opts.repo, "application/x-bzip", opts.repo);
    server.send(message,function(error,message){
	    var fs = require('fs');
	    if(error && (error.message || error.error)){//If the email failed, move it to a safe location
		fs.rename(opts.repo,join(opts.config.dirs.save,opts.repo),function(){
			process.exit(1);// We have lots of debug info, however...
		    });
	    }else{// Delete the repo once it's done
		fs.unlink(opts.repo,cont);
	    }
	});
};

function subject(_){
    return 'subject';
}