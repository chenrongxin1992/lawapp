var express = require('express');
var router = express.Router();

/* 搜索界面 */
router.get('/index', function(req, res, next) {
	return res.render('shouye/index');
});

module.exports = router;
