var express = require('express');
var router = express.Router();

const QueAndAns = require('../db/struct').QueAndAns
const mspj = require('../db/struct').mspj
const async = require('async')

const sorttype = 1 //1相关性排序，2时间排序，3热度排序 默认1

var fs = require('fs');
var os = require('os');

/* GET home page. */
router.get('/', function(req, res, next) {
	//return res.json({'code':0})
  //return res.render('index', { title: 'Express' });
   console.log('redirect')
   res.render('index')
   //res.redirect('/lawapp/shouye/index')
});

//读取txt
router.get('/txt',function(req,res){
	//目录下的文件
	async.waterfall([
		function(cb){
			fs.readdir(__dirname+'/law_files_txt',function(err,files){
				if(err){
					console.log(err)
					return res.json({'code':-1,'msg':err})
				}
				//console.log(files)
				cb(null,files)
				//return res.json({'code':0,'msg':files})
			})
		},
		function(files,cb){
			files.forEach(function(filename){
				let o = fs.readFileSync(__dirname+'/law_files_txt/'+filename,'utf-8')
				let arr = o.split('\r\n')
				let newArr = arr.filter(function(value,index,arr){
					if(value!=''&&value.length != 0){
					        return true
					    }
					    return false
				})
				//获取正文数组
				let zwarr = newArr.filter(function(v,i,arr){
					if(i>5&&i<newArr.length-1){
						return true
					}
					return false
				})
				let zwstr = zwarr.join('')
				let patt = /依照《(.*?)》/
				let yjtl = patt.exec(newArr)
				//console.log('依据---->',yjtl)
				let mspjsave = new mspj({
					biaoti:newArr[2],
					fymc:newArr[3],
					pjs:newArr[4],
    				bh:newArr[5],
    				zw:zwstr,
    				yjtl:yjtl
				})
				mspjsave.save(function(serr){
					if(serr){
						console.log('save err',serr)
						return res.json({'code':-1,'msg':serr})
					}
					console.log('save success')
				})
			})
		}
	],function(error,result){
		if(error){
			console.log('async error',error)
			return res.json({'code':-1,'msg':error})
		}
		return res.json({'code':0,'msg':'success'})
	})
	
	//读取文件
	// console.log('__dirname',__dirname)
	// //return false
	// let o = fs.readFileSync(__dirname+'/2030比赫电气（太仓）有限公司与何林劳动争议二审民事判决书.txt','utf-8')
	// //分解txt文件
	// let arr = o.split('\r\n')
	// let newArr = arr.filter(function(value,index,arr){
	// 	///console.log(value.length)
	//     if(value!=''&&value.length != 0){
	//     	console.log(value)
	//     	//console.log()
	//         return true
	//     }
	//     return false
	// })
	// //循环分解数组中的元素
	// let len = newArr.length
	// return res.json({'arr.length':newArr.length,'content':newArr})
})

//index-->search
router.post('/search',function(req,res){
	console.log('req.body',req.body)
	let keywords = req.body.keywords,
		type = req.body.type
	let page = req.body.page,
		limit = req.body.limit

	page ? page : 1;//当前页
	limit ? limit : 10;//每页数据

	if(!page){
		page = 1
	}
	if(!limit){
		limit = 10
	}
	
	//分割字符串
	keywords_arr = keywords.split(/\s+/)
	keywords_arr1 = []
	console.log('keywords_arr:',keywords_arr)
	async.waterfall([
		function(cb){
			keywords_arr.forEach(function(item,index){
				keywords_arr1.push({'questioncontent':{'$regex':new RegExp(item,'i')}})
				keywords_arr1.push({'tags':{'$regex':new RegExp(item,'i')}})
				keywords_arr1.push({'questioner':{'$regex':new RegExp(item,'i')}})
				keywords_arr1.push({'questioncity':{'$regex':new RegExp(item,'i')}})
				keywords_arr1.push({'questionmoney':{'$regex':new RegExp(item,'i')}})
				keywords_arr1.push({'questiontype':{'$regex':new RegExp(item,'i')}})
				keywords_arr1.push({'questionstate':{'$regex':new RegExp(item,'i')}})
			})
			console.log('keywords_arr1',keywords_arr1)
			cb()
		},
		function(cb){
			let search = QueAndAns.find({//多条件模糊查询
					$or : keywords_arr1
				}
			)
			search.count()
			search.exec(function(err,total){
				if(err){
					console.log('search total err--->',err)
					cb(err)
				}
				cb(null,total)		
			})
		},
		function(total,cb){
			let numSkip = (page-1)*limit
				limit = parseInt(limit)
			console.log('check -- >',limit,page,numSkip)

			let search = QueAndAns.find({//多条件模糊查询
					$or : keywords_arr1
				}
			)
			search.limit(limit)
			search.skip(numSkip)
			search.exec(function(err,docs){
				if(err){
					console.log('search docs err--->',err)
					cb(err)
				}
				let result = {}
				result.total = total
				result.docs = docs
				result.curr = page
				cb(null,result)		
			})
		}
	],function(error,result){
		if(error){
			console.log('async waterfall error',error)
			return res.json({'code':-1,'msg':error})
		}
		console.log('finish waterfall')
		return res.render('search',{'result':result,'reqbody':req.body})
		//return res.json({'code':0,'result':result})
	})
	//
})

router.post('/searchapi',function(req,res){
	console.log('req.body',req.body)
	let keywords = req.body.keywords,
		type = req.body.type
	let page = req.body.page,
		limit = req.body.limit

	page ? page : 1;//当前页
	limit ? limit : 10;//每页数据

	if(!page){
		page = 1
	}
	if(!limit){
		limit = 10
	}
	
	let state = req.body.state,//对应数据库questiontype字段 '专家号'
		city = req.body.city,
		questiontype = req.body.questiontype//对应数据库questionstate字段 数字表示

	console.log('state',state)
	console.log('city',city)
	console.log('questiontype',questiontype)

	//分割字符串
	keywords_arr = keywords.split(/\s+/)
	keywords_arr1 = []
	console.log('keywords_arr:',keywords_arr)
	async.waterfall([
		function(cb){
			keywords_arr.forEach(function(item,index){
				keywords_arr1.push({'questioncontent':{'$regex':new RegExp(item,'i')}})
				keywords_arr1.push({'tags':{'$regex':new RegExp(item,'i')}})
				keywords_arr1.push({'questioner':{'$regex':new RegExp(item,'i')}})
				keywords_arr1.push({'questioncity':{'$regex':new RegExp(item,'i')}})
				keywords_arr1.push({'questionmoney':{'$regex':new RegExp(item,'i')}})
				keywords_arr1.push({'questiontype':{'$regex':new RegExp(item,'i')}})
				keywords_arr1.push({'questionstate':{'$regex':new RegExp(item,'i')}})
			})
			console.log('keywords_arr1',keywords_arr1)
			cb()
		},
		function(cb){
			let search = QueAndAns.find({//多条件模糊查询
					$or : keywords_arr1
				}
			)
			if(questiontype && questiontype!=2){
				console.log('限制问题状态',questiontype)
				search.where('questionstate').equals(questiontype)
			}
			if(city && city!='全部地区'){
				console.log('限制问题城市')
				search.where('questioncity').equals(city)
			}
			if(state && state != '' && state!='全部类型'){
				console.log('限制问题类型',state)
				search.where('questiontype').equals(state)
			}
			search.count()
			search.exec(function(err,total){
				if(err){
					console.log('search total err--->',err)
					cb(err)
				}
				cb(null,total)		
			})
		},
		function(total,cb){
			let numSkip = (page-1)*limit
				limit = parseInt(limit)
			console.log('check -- >',limit,page,numSkip)

			let search = QueAndAns.find({//多条件模糊查询
					$or : keywords_arr1
				}
			)
			if(questiontype && questiontype!=2){
				console.log('限制问题状态')
				search.where('questionstate').equals(questiontype)
			}
			if(city && city!='全部地区'){
				console.log('限制问题城市')
				console.log('city',city)
				search.where('questioncity').equals(city)
			}
			if(state && state != '' && state!='全部类型'){
				console.log('限制问题类型')
				search.where('questiontype').equals(state)
			}
			search.limit(limit)
			search.skip(numSkip)
			search.exec(function(err,docs){
				if(err){
					console.log('search docs err--->',err)
					cb(err)
				}
				let result = {}
				result.total = total
				result.docs = docs
				result.curr = page
				cb(null,result)		
			})
		}
	],function(error,result){
		if(error){
			console.log('async waterfall error',error)
			return res.json({'code':-1,'msg':error})
		}
		console.log('finish waterfall')
		return res.render('resultdata',{'result':result})
		//return res.json({'code':0,'result':result})
	})
	//
})
//临时添加测试记录
router.post('/addqs',function(req,res){
	console.log(req.body)
	let newrecord = new QueAndAns({
		questioner:req.body.questioner,
		company:req.body.company,
		tags:(req.body.tags).split(','),
		questiontype:req.body.questiontype,
		questioncity:req.body.questioncity,
		questionmoney:req.body.questionmoney,
		questionstate:req.body.questionstate,
		questioncontent:req.body.questioncontent
	})
	newrecord.save(function(err){
		if(err){
			console.log('save record err',err)
			return res.json({'code':-1,'msg':err})
		}
		return res.json({'code':0,'msg':'success'})
	})

})
module.exports = router;
