//路由规则全部写在这里.
//连接数据库
var mongo = require('../models/db');
//加密模块
var crypto = require('crypto');
//注册信息操作类
var User = require('../models/User');
module.exports = function(app){
    //首页的路由
    app.get('/',function(req,res){
        res.render('index',{
            title:'首页',
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        });
    })
    //注册页面的路由
    app.get('/reg',function(req,res){
        res.render('reg',{
            title:'注册页面',
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        })
    })
    app.post('/reg',function(req,res){
        //1.收集数据
        var name = req.body.username;
        var password = req.body.password;
        var password_re = req.body['password_re'];
        //2.判断一下两次密码是否一致
        if(password !== password_re){
            req.flash('error','两次密码不一样');
            return res.redirect('/reg');
        }
        //3.密码进行加密
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('hex');

        //整理到一个对象上去
        var newUser = new User({
            name:name,
            password:password,
            email:req.body.email
        })
        //检查用户名是否被占用
        User.get(newUser.name,function(err,user){
            if(err){
                req.flash('error',err);
                return res.redirect('/reg');
            }
            if(user){
                req.flash('error','用户名被占用');
                return res.redirect('/reg');
            }
            //把数据存放到数据库里面去
            newUser.save(function(err,user){
                if(err){
                    req.flash('error',err);
                    return res.redirect('/reg');
                }
                req.session.user = user;
                req.flash('success','注册成功');
                return res.redirect('/');
            })
        })
    })
    //登录
    app.get('/login',function(req,res){
        res.render('login',{title:'登录页面'})
    })
    app.post('/login',function(req,res){

    })
    //退出
    app.get('/logout',function(req,res){

    })

}