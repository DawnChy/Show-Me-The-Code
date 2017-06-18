var express=require('express');
var router=express.Router();
var User=require('../models/user.js');
var credentials=require('../credentials.js');
var emailService=require('../lib/email.js')(credentials);
var crypto=require('crypto');//加密模块

/*GET home page.*/
router.get('/',function (req,res,next) {
    //使用默认布局（main.hbs）
    res.render('home');
});

/*GET start page.*/
router.get('/start',function (req,res,next) {
    res.render('start');
});

/*GET study page.*/
router.get('/study',function (req,res,next) {
    res.render('study');
});

/*GET communication page.*/
// router.get('/communicate',function (req,res,next) {
//     res.render('communicate');
// });
router.post('/communicate',function (req,res,next) {
    res.render('communicate');
});

/*GET about page.*/
router.get('/about',function (req,res,next) {
    res.render('about');
});
/*GET 发表文章.*/
router.get('/publish',function (req,res,next) {
    res.render('publish');
});
/*GET 评论.*/
router.get('/article_of_one',function(req,res,nest){
    res.render('article_of_one');
});
/*GET login page.*/
router.get('/login',function (req,res,next) {
    res.render('login');
});

/*GET register page.*/
router.get('/register',function (req,res,next) {
    res.render('register');
});
//用户注册数据存储
router.post('/register',registerFn);
//加密函数
// function hashPW(pwd) {
//     return crypto.createHash('sha256').update(pwd).digest('base64').toString();
// };
function registerFn(req,res) {
    var user=new User({username:req.body.name});
    user.set('email',req.body.email);
    user.set('password',req.body.password);
    user.save(function (err) {
        if(err){
            req.session.error=err;
            console.log("===存储失败！===");
            return res.redirect('/register');
        } else {
            console.log('===注册成功==='+user.id+'=='+req.body.name+'===pwd==='+user.password);
            emailService.send(req.body.email,'thank you for register!','注册成功');
            req.session.user=user.id;
            req.session.username=user.username;
            return res.redirect('/login');
        }
    })
};
//用户登录
router.post('/login',loginFn);
function loginFn(req,res,next){
    User.find({email:req.body.email,password:req.body.password})
        .select('username email')
        .exec(function (err,users) {
            var DATA={
                users:users.map(function (user) {
                    return {
                        _id:user._id,
                        name:user.username,
                        email:user.email,
                    };
                })
            };
            if (DATA.users.length>0){
                req.session.userSession=DATA.users[0];
                console.log(req.session.userSession);
                return res.redirect('/communicate');
            } else {
                return res.redirect('/login');
            };
        });
};
//传递登录信息
router.get('/session',function(req,res,next){
    res.send(req.session.userSession)
    res.end;
});
// 退出登录
router.get('/OutLogin',function(req,res,next){
    req.session.userSession='';
    return res.redirect('/communicate');
});

//发表文章
router.post('/publish',function (req,res,next) {
   var self=this;
   var now = new Date();
   self.timestr=Date.now();
   var userNewMsg = {
       article_head : req.body.publish_title,
       article_info : self.timestr,
       article_body : req.body.publish_content,
   };
   User.update({username:req.session.userSession.name}, userNewMsg, function (err) {
       if(err) {
           console.log("错误：+++++++" + err);
           return;
       }else {
           console.log("update success");
           User.find({},function (err,users) {
               var data={
                   users:users.map(function (user) {
                       return {
                           article_head : user.article_head,
                           article_info : user.article_info,
                           article_body : user.article_body,
                       };
                   })
               };
               console.log(userNewMsg);
               return res.redirect('/communicate');
           });
       }
   });
});
//论坛获取文章
router.get('/communicate',function (req,res,next) {
    User.find({},{username:true,article_head:true,article_info:true,article_body:true,comment_content:true,comment_preson:true,comment_time:true,count:true},function(err,users){
        var data={
            users:users.map(function (user) {
                return {
                    _id : user._id,
                    name : user.username,
                    email : user.email,
                    article_head : user.article_head,
                    article_info : user.article_info,
                    article_body : user.article_body,
                    comment_content:user.comment_content,
                    comment_preson:user.comment_preson,
                    comment_time:user.comment_time,
                    count : user.count,
                };
            })
        };
        if (data.users.length>0){
            req.session.userArtcle=data.users;
            console.log('找到所有文章！');
        };
        // res.send(data);
    });
    res.render('communicate');
});
//传递文章信息
router.get('/articleSession',function(req,res,next){
    res.send(req.session.userArtcle);
    res.end;
});
//查看某一文章
router.get('/articleofone',function(req,res,next){

    User.find().where('article_head').equals(req.query.head).exec(function (err,users) {
        var data={
            users:users.map(function (user) {
                return {
                    _id : user._id,
                    name : user.username,
                    email : user.email,
                    article_head : user.article_head,
                    article_info : user.article_info,
                    article_body : user.article_body,
                    count : user.count,
                };
            })
        };
        req.session.dataOfone=data.users[0];
        console.log('找到该文章');
        res.send(data);
    });
});
router.get('/onearticle',function(req,res,nest){
    res.send(req.session.dataOfone);
    // 浏览次数
    // var counts={
    //     count:req.session.dataOfone.count+1,
    // };
    // User.update({count:req.body.count},counts, function (err) {
    //     if(err) {
    //         console.log("错误：+++++++" + err);
    //         return;
    //     }else {
    //         User.find({},function (err,users) {
    //             var data={
    //                 users:users.map(function (user) {
    //                     return {
    //                         count:user.count,
    //                     };
    //                 })
    //             };
    //         });
    //     };
    // });
});
//评论
router.post('/article_of_one',function(req,res,next){
    var self=this;
    var now = new Date();
    self.timestr=Date.now();
    var userNewcomment = {
        comment_content : req.body.comment_content,
        comment_time : self.timestr,
        comment_preson : req.session.userSession.name,
    };
    User.update({username:req.session.dataOfone.name}, userNewcomment, function (err) {
        if(err) {
            console.log("错误：+++++++" + err);
            return;
        }else {
            User.find({},function (err,users) {
                var data={
                    users:users.map(function (user) {
                        return {
                            comment_content:user.comment_content,
                            comment_time:user.comment_time,
                            comment_preson:user.comment_preson,
                            // count:user.count+1,
                        };
                    })
                };
                return res.redirect('/communicate');
            });
        }
    });
});


module.exports = router;
