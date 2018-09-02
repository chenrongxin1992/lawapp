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



exports.catinfo = mongoose.model('catinfo',catSchema);
