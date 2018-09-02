var express = require('express');
var router = express.Router();

/* basicsearch */
router.post('/search', function(req, res, next) {
	// console.log('req.query--->',req.query)
	console.log('req.body--->',req.body)
	let arg = {}
	arg.query = req.body.query
	arg.filter = req.body.filter
	arg.advs = req.body.advs
	arg.searchType = req.body.searchType
	arg.includeJcy = req.body.includeJcy
	arg.nAjlx = req.body.nAjlx
	return res.render('basicsearch/search',{'arg':arg});
});

module.exports = router;
