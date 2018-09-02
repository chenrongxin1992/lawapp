var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
	//return res.json({'code':0})
  //return res.render('index', { title: 'Express' });
   console.log('redirect')
   res.render('index')
   //res.redirect('/lawapp/shouye/index')
});

module.exports = router;
