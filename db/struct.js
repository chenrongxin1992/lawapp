/**
 *  @Author:    chenrongxin
 *  @Create Date:   2018-8-24
 *  @Description:   存储结构
 */

    const mongoose = require('mongoose')
    mongoose.Promise = global.Promise;
    //服务器上
    const DB_URL = 'mongodb://lawapp:youtrytry@localhost:27017/lawapp'
    //本地
    //const DB_URL = 'mongodb://localhost:27017/dxxxhjs'
    mongoose.connect(DB_URL)

    /**
      * 连接成功
      */
    mongoose.connection.on('connected', function () {    
        console.log('Mongoose connection open to ' + DB_URL);  
    });    

    /**
     * 连接异常
     */
    mongoose.connection.on('error',function (err) {    
        console.log('Mongoose connection error: ' + err);  
    });    
     
    /**
     * 连接断开
     */
    mongoose.connection.on('disconnected', function () {    
        console.log('Mongoose connection disconnected');  
    });   

//var mongoose = require('./db'),
    let Schema = mongoose.Schema,
    moment = require('moment')

var catSchema = new Schema({ 
    cfield : {type:String},
    title : {type:String},
    isCheckBox : {type:Boolean},
    id : {type:Number},
    catname : {type:String},//分类名:如党章、十九大         
    inused : {type:Boolean,default:true},//该类别是否在用
    leixing : {type:String},//单选，多选，判断
    timu : {type:String},//题目(党章的意义是什么) 
    zqda : {type : String},//正确答案(A,B,C,D,E,F / AB,AD / 1,2)
    xuanxiang : [{
        id : {type:Number},//选项id
        content : {type:String,default:null},//选项内容
        is_correct : {type:Boolean,default:false}//是否为正确选项0错
    }],
    random:{type:Number,default:parseInt(Math.random()*100000)},
    peopleinfo : {type:String,default:null},//录入人员信息
    createTime : {type:String, default : moment().format('YYYY-MM-DD HH:mm:ss') },//创建时间
    createTimeStamp : {type:String,default:moment().format('X')}//创建时间戳
})

//提问和回答(对应搜索中type1)
var questionandanswer = new Schema({
    type:{type:String},
    questioner : {type:String},//提问者
    company : {type:String},//公司或机构
    questiontime : {type:String,default:moment().format('YYYY-MM-DD HH:mm:ss')},//提问时间
    tags : {type:Array},//标签
    questiontype : {type:String},//问题类型 0专家号1快问快答
    questioncity : {type:String},//问题所在城市
    questionmoney : {type:String},//问题价格
    questionstate : {type:String},//问题状态0提问中1已结束2已采纳
    createTimeStamp : {type:String,default:moment().format('X')},
    questioncontent : {type:String},//问题内容
    answers : [{
        answername:{type:String},//回答者名字
        answertime:{type:String},//回答时间
        answercontent:{type:String},//回答内容
    }]

})

//民事判决
var mspj = new Schema({
    biaoti:{type:String},
    fymc:{type:String},//法院名称
    pjs:{type:String},//判决书
    bh:{type:String},//编号
    zw:{type:String},//正文
    yjtl:{type:String}//依据条例
})

exports.catinfo = mongoose.model('catinfo',catSchema);
exports.QueAndAns = mongoose.model('QueAndAns',questionandanswer);
exports.mspj = mongoose.model('mspj',mspj);
