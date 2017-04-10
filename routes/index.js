//路由规则全部写在这里.
//连接数据库
var mongo = require('../models/db');
//加密模块
var crypto = require('crypto');
//注册信息操作类
var User = require('../models/User');
//引入Post操作类
var Post = require('../models/Post');
//让未登录的用户不能访问发表和退出
function checkLogin(req,res,next){
    if(!req.session.user){
        req.flash('error','未登录');
        res.redirect('/login');
    }
    next();
}
//让已登录的用户不能访问登录和注册
function checkNotLogin(req,res,next){
    if(req.session.user){
        req.flash('error','已登录');
        res.redirect('back');
    }
    next();
}
module.exports = function(app){
    //首页的路由
    app.get('/',function(req,res){
        Post.get(null,function(err,posts){
            if(err){
                posts = [];
            }
            res.render('index',{
                title:"首页",
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString(),
                posts:posts
            })
        })
    })
    //注册页面的路由
    app.get('/reg',checkNotLogin,function(req,res){
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
    app.get('/login',checkNotLogin);
    app.get('/login',function(req,res){
        res.render('login',{
            title:'登录页面',
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        })
    })
    app.post('/login',function(req,res){
        //1.对用户提交的密码进行加密处理
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('hex');
        //2.检查用户名是否存在
        User.get(req.body.username,function(err,user){
            if(err){
                req.flash('error',err);
                return res.redirect('/login');
            }
            if(!user){
                req.flash('error','用户名不存在');
                return res.redirect('/login');
            }
            //3.对比密码是否一样
            if(user.password !== password){
                req.flash('error','密码错误');
                return res.redirect('/login');
            }
            //4.最后登录成功后，把登录信息放入SESSION,提示成功，跳转首页
            req.session.user = user;
            req.flash('success','登录成功');
            return res.redirect('/');
        })


    })
    //退出
    app.get('/logout',checkLogin);
    app.get('/logout',function(req,res){
        req.session.user = null;
        req.flash('success','退出成功');
        return res.redirect('/');
    })
    //发表的路由
    app.get('/post',checkLogin);
    app.get('/post',function(req,res){
        res.render('post',{
            title:"发表",
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        })
    })
    //发表的行为
    app.post('/post',function(req,res){
        //1.获取当前登录的用户名
        var currentUser = req.session.user.name;
        var post = new Post(currentUser,req.body.title,req.body.post);
        post.save(function(err){
            if(err){
                req.flash('error','发表失败');
                return res.redirect('/post');
            }
            req.flash('success','发表成功');
            return res.redirect('/');
        })
    })
}