/**
 * Created by hama on 2017/4/12.
 */
var mongo = require("./db");
function Comment(name,minute,title,comment,callback){
    this.name = name;
    this.minute = minute;
    this.title = title;
    this.comment = comment;
}
module.exports = Comment
Comment.prototype.save = function(callback){
    var name = this.name;
    var minute = this.minute;
    var title = this.title;
    var comment = this.comment;
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
            },{
                $push:{'comments':comment}
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