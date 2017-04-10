/**
 * Created by hama on 2017/4/10.
 */
//1.连接数据库
var mongo = require('./db');
//2.设计Post类
function Post(name,title,post){
    this.name = name;
    this.title = title;
    this.post = post;
}
module.exports = Post

//3.sava方法用来保存用户发布的文章
Post.prototype.save = function(callback){
    var date = new Date();
    var time = {
        date:date,
        year:date.getFullYear(),
        month:date.getFullYear() + '-' + (date.getMonth() < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1),
        day:date.getFullYear() + '-' + (date.getMonth() < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-' + (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()),
        minute:date.getFullYear() + '-' + (date.getMonth() < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1 ) + '-' + (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + ' ' + (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':' +
        (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds())
    }
    //把要存放入数据库的东西放到一个对象中去
    var post = {
        name:this.name,
        title:this.title,
        time:time,
        post:this.post
    }
    //进行数据库操作
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.insert(post,{safe:true},function(err,post){
                mongo.close();
                if(err){
                    return callback(err);
                }
                return callback(null);//保存文章是不需要返回任何信息的.
            })
        })
    })
}
//获取所有的文章(根据name条件)
Post.get = function(name,callback){
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            var query = {};
            if(name){
                query.name = name;
            }
            collection.find(query).sort({time:-1}).toArray(function(err,docs){
                mongo.close();
                if(err){
                    return callback(err);
                }
                return callback(null,docs);//数组形式返回所有的文章.
            })
        })
    })
}
