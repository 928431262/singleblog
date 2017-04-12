/**
 * Created by hama on 2017/4/10.
 */
//1.连接数据库
var mongo = require('./db');
var markdown = require('markdown').markdown;
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
        post:this.post,
        //增加一个字段，保存文章的留言
        comments:[]
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
Post.getTen = function(name,page,callback){
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
            //重新设计
            collection.count(query,function(err,total){
                collection.find(query,{
                    skip:(page - 1) * 10,
                    limit:10
                }).sort({
                    time:-1
                }).toArray(function(err,docs){
                    mongo.close();
                    if(err){
                        return callback(err);
                    }
                    //解析markdown
                    docs.forEach(function(doc){
                        doc.post = markdown.toHTML(doc.post)
                    })
                    callback(null,docs,total);
                })
            })
        })
    })
}
//获取一篇文章
Post.getOne = function(name,minute,title,callback){
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.findOne({
                "name":name,
                "title":title,
                "time.minute":minute
            },function(err,doc){
                mongo.close();
                if(err){
                    return callback(err);
                }
                //文章正文的markdown解析
                doc.post = markdown.toHTML(doc.post);
                //留言的markdown解析
                doc.comments.forEach(function(comment){
                    comment.content = markdown.toHTML(comment.content);
                })
                return callback(null,doc);
            })
        })
    })
}
Post.edit = function(name,minute,title,callback){
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.findOne({
                'name':name,
                'time.minute':minute,
                'title':title
            },function(err,doc){
                mongo.close();
                if(err){
                    return callback(err);
                }
                return callback(null,doc);
            })
        })
    })
}
//更新文章
Post.update = function(name,minute,title,post,callback){
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.update({
                'name':name,
                'time.minute':minute,
                'title':title
            },{$set:{post:post}},function(err){
                mongo.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            })
        })
    })
}
Post.remove = function(name,minute,title,callback){
    mongo.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.remove({
                'name':name,
                'time.minute':minute,
                'title':title
            },{
                w:1
            },function(err){
                mongo.close();
                if(err){
                    return callback(err);
                }
                return callback(null);
            })
        })
    })
}

