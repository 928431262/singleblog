/**
 * Created by hama on 2017/4/10.
 */
var mongo = require('./db');
var markdown = require('markdown').markdown;
function Post(name,title,tags,post){
    this.name = name;
    this.title = title;
    this.tags = tags;
    this.post = post;

}
module.exports = Post
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
    var post = {
        name:this.name,
        title:this.title,
        time:time,
        post:this.post,
        comments:[],
        tags:this.tags,
        pv:0
    }
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
                return callback(null);
            })
        })
    })
}
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
                    docs.forEach(function(doc){
                        doc.post = markdown.toHTML(doc.post)
                    })
                    callback(null,docs,total);
                })
            })
        })
    })
}
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
                if(err){
                    mongo.close();
                    return callback(err);
                }
                if (doc) {
                    collection.update({
                        "name": name,
                        "time.minute": minute,
                        "title": title
                    }, {
                        $inc: {"pv": 1}
                    }, function (err) {
                        mongo.close();
                        if (err) {
                            return callback(err);
                        }
                    });
                    doc.post = markdown.toHTML(doc.post);
                    doc.comments.forEach(function (comment) {
                        comment.content = markdown.toHTML(comment.content);
                    })
                    return callback(null, doc);
                }
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
Post.getArchve = function (callback) {
    mongo.open(function (err,db) {
        if(err){
            return callback(err)
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close()
                return callback(err)
            }
            collection.find({},{
                'name':1,
                'time':1,
                'title':1
            }).sort({
                time:-1
            }).toArray(function (err,docs) {
                mongo.close()
                if(err){
                    return callback(err)
                }
                return callback(null,docs)
            })
        })
    })
}
Post.getTags = function(callback) {
    mongo.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongo.close();
                return callback(err);
            }
            collection.distinct("tags", function (err, docs) {
                mongo.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};
Post.getTag = function(tag, callback) {
    mongo.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongo.close();
                return callback(err);
            }
            collection.find({
                "tags": tag
            }, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray(function (err, docs) {
                mongo.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};
Post.search = function(keyword, callback) {
    mongo.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var pattern = new RegExp(keyword, "i");
            collection.find({
                "title": pattern
            }, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray(function (err, docs) {
                mongo.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};


