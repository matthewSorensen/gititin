exports.dirs = {tmp: '/tmp',
		src: '/home/matthew/cs/gititin',
		template: '/home/matthew/cs/gititin/template-repo',
		save: '/home/matthew/cs/'};
//This will probably get large
exports.email = {host: 'smtp.gmail.com',
		 ssl: true,
		 use_authentication: true,
		 user: 'server username',
		 password: 'password',
		 target: 'person to send email to',
		 account: 'account to send from'
		 };
exports.debug = {maintainer: 'account to send errors to',
		 log: '/home/matthew/cs/error.log',
		 email: true,
		 stderr: false };
