//路由规则全部写在这里.
//连接数据库
var mongo = require('../models/db');
var crypto = require('crypto');
var User = require('../models/User');
var Post = require('../models/Post');
var Comment = require('../models/Comment');
var multer  = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb){
        cb(null, './public/images')
    },
    filename: function (req, file, cb){
        cb(null, file.originalname)
    }
});
var upload = multer({
    storage: storage
});
function checkLogin(req,res,next){
    if(!req.session.user){
        req.flash('error','未登录');
        res.redirect('/login');
    }
    next();
}
function checkNotLogin(req,res,next){
    if(req.session.user){
        req.flash('error','已登录');
        res.redirect('back');
    }
    next();
}
module.exports = function(app){
    app.get('/',function(req,res){
        var page = parseInt(req.query.p) || 1;
        Post.getTen(null,page,function(err,posts,total){
            if(err){
                posts = [];
            }
            res.render('index',{
                title:"首页",
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString(),
                posts:posts,
                page:page,
                isFirstPage:(page - 1) == 0,
                isLastPage:((page - 1) * 10) + posts.length == total,
                totals:Math.ceil(total/10)
            })
        })
    })
    app.get('/reg',checkNotLogin,function(req,res){
        res.render('reg',{
            title:'注册页面',
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        })
    })
    app.post('/reg',function(req,res){
        var name = req.body.username;
        var password = req.body.password;
        var password_re = req.body['password_re'];
        if(password !== password_re){
            req.flash('error','两次密码不一样');
            return res.redirect('/reg');
        }
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('hex');
        var newUser = new User({
            name:name,
            password:password,
            email:req.body.email
        })
        User.get(newUser.name,function(err,user){
            if(err){
                req.flash('error',err);
                return res.redirect('/reg');
            }
            if(user){
                req.flash('error','用户名被占用');
                return res.redirect('/reg');
            }
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
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('hex');
        User.get(req.body.username,function(err,user){
            if(err){
                req.flash('error',err);
                return res.redirect('/login');
            }
            if(!user){
                req.flash('error','用户名不存在');
                return res.redirect('/login');
            }
            if(user.password !== password){
                req.flash('error','密码错误');
                return res.redirect('/login');
            }
            req.session.user = user;
            req.flash('success','登录成功');
            return res.redirect('/');
        })


    })
    app.get('/logout',checkLogin);
    app.get('/logout',function(req,res){
        req.session.user = null;
        req.flash('success','退出成功');
        return res.redirect('/');
    })
    app.get('/post',checkLogin);
    app.get('/post',function(req,res){
        res.render('post',{
            title:"发表",
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        })
    })
    app.post('/post',function(req,res){
        var currentUser = req.session.user.name;
        var tags = [req.body.tag1,req.body.tag2,req.body.tag3]
        var post = new Post(currentUser,req.body.title,tags,req.body.post);
        post.save(function(err){
            if(err){
                req.flash('error','发表失败');
                return res.redirect('/post');
            }
            req.flash('success','发表成功');
            return res.redirect('/');
        })
    })
    app.get('/upload',checkLogin);
    app.get('/upload',function(req,res){
        res.render('upload',{
            title:'上传页面',
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        })
    })
    app.post('/upload',upload.array('field1',5),function(req,res){
        req.flash('success','上传成功');
        res.redirect('/post');
    })
    app.get('/search', function (req, res) {
        Post.search(req.query.keyword, function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('search', {
                title: "SEARCH:" + req.query.keyword,
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    app.get('/u/:name',function(req,res){
        var page = parseInt(req.query.p) || 1;
        User.get(req.params.name,function(err,user){
            if(err){
                req.flash('error',err);
                res.redirect('/');
            }
            if(!user){
                req.flash('error','用户名不存在');
                res.redirect('/');
            }
            Post.getTen(user.name,page,function(err,posts,total){
                if(err){
                    req.flash('error',err);
                    res.redirect('/');
                }
                res.render('user',{
                    title:'用户文章列表',
                    user:req.session.user,
                    success:req.flash('success').toString(),
                    error:req.flash('error').toString(),
                    posts:posts,
                    page:page,
                    isFirstPage:(page - 1) == 0,
                    isLastPage:((page - 1)*10) + posts.length == total
                })
            })

        })
    })
    app.get('/u/:name/:minute/:title',function(req,res){
        Post.getOne(req.params.name,req.params.minute,req.params.title,function(err,post){
            if(err){
                req.flash('error',err);
                res.redirect('/');
            }
            res.render('article',{
                title:'文章详情页面',
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString(),
                post:post
            })
        })
    })
    app.get('/edit/:name/:minute/:title',checkLogin);
    app.get('/edit/:name/:minute/:title',function(req,res){
        Post.edit(req.params.name,req.params.minute,req.params.title,function(err,post){
            if(err){
                req.flash('error',err);
                res.redirect('back');
            }
            res.render('edit',{
                title:"编辑页面",
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString(),
                post:post
            })
        })
    })
    app.post('/edit/:name/:minute/:title',checkLogin);
    app.post('/edit/:name/:minute/:title',function(req,res){
        Post.update(req.params.name,req.params.minute,req.params.title,req.body.post,function(err){
            var url = '/u/'+ req.params.name + '/' + req.params.minute + '/' + req.params.title;
            if(err){
                req.flash('error',err);
                res.redirect(url);
            }
            req.flash('success','发布成功');
            res.redirect(url);
        })
    })
    app.get('/remove/:name/:minute/:title',checkLogin);
    app.get('/remove/:name/:minute/:title',function(req,res){
        Post.remove(req.params.name,req.params.minute,req.params.title,function(err){
            if(err){
                req.flash('error',err);
                res.redirect('back');
            }
            req.flash('success','删除成功');
            res.redirect('/');
        })
    })
    app.post('/comment/:name/:minute/:title',function(req,res){
        var date = new Date();
        var time = date.getFullYear() + '-' + (date.getMonth() < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1 ) + '-' + (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + ' ' + (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':' +
            (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());
        var comment = {
            name:req.body.name,
            time:time,
            content:req.body.content
        }
        var newComment = new Comment(req.params.name,req.params.minute,req.params.title,comment);
        newComment.save(function(err){
            if(err){
                req.flash('error',err);
                res.redirect('back');
            }
            req.flash('success','留言成功');
            res.redirect('back');
        })


    })
    app.get('/tags', function (req, res) {
        Post.getTags(function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('tags', {
                title: '标签',
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    app.get('/tags/:tag',function (req,res) {
        Post.getTag(req.params.tag,function (err,posts) {
            if(err){
                req.flash('error',err)
                return res.redirect('/')
            }
            res.render('tag',{
                title: 'TAG:' + req.params.tag,
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            })
        })
    })
    app.get('/geren',function (req,res) {
        res.render('geren',{
            title:'个人中心',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        })
    })
}