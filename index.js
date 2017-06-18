//创建系统依赖模块
express = require('express');
var session = require('express-session');
//实例化Express应用
var app = express();
//导入body-parser,用于表单提交  post方式
var body_parser = require('body-parser');
var credentials=require('./credentials.js');

//设置handlebars视图引擎及视图目录和视图文件扩展名
var handlebars = require('express-handlebars').create({
    //设置默认布局为main
    defaultLayout:'main',
    //设置模板引擎文件后缀名为.hbs
    extname:'.hbs',
    //创建一个Handlebars辅助函数，让它给出一个到静态资源的连接
    helpers:{
        static:function (name) {
            return require('.lib/static.js').map(name);
        },
        section:function (name,options) {
            if(!this._sections)
                this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        },
    }
});
app.engine('hbs',handlebars.engine);
app.set('view engine','hbs');

//导入自定义模块(路由、模块、模式)
var routes_index = require('./routes/index');

//设置端口号
app.set('port',process.env.PORT||8803);

//中间件
app.use(body_parser());
app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')());

//设置静态资源
app.use(express.static(__dirname+'/public'));

//数据库
var emailService=require('./lib/email.js')(credentials);//引入credentials.js文件
// database configuration数据库配置
var mongoose=require('mongoose');//引用mongoose模块
var options={
    server:{
        socketOptions:{keepAlive:1}
    }
};
mongoose.Promise = global.Promise;
switch(app.get('env')){
    case 'development':
// 连接到数据库
        mongoose.connect(credentials.mongo.development.connectionString,options);
        break;
    case 'production':  mongoose.connect(credentials.mongo.production.connectionString,options);
        break;
    default:
        throw new Error('Unknown execution environment:'+app.get('env'));
};

//设置路由
app.use('/',routes_index);

//定制404页面
app.use(function (req,res) {
    res.status(404);
    res.render('error/404');
});

//定制500页面
app.use(function (err,req,res,next) {
    console.log(err.stack);
    res.status(500);
    res.render('error/500');
});

//启动服务器、应用
app.listen(app.get('port'),function () {
    console.log('使用http://localhost:'+app.get('port')+' 开启服务器；退出：ctrl+c');
});
