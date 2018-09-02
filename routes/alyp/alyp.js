var express = require('express');
var router = express.Router();

/* basicsearch */
router.post('/alypSuggest', function(req, res, next) {
	//console.log('333333333')
	console.log('alypSuggest')
	return res.end('200');
});

module.exports = router;
