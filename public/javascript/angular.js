angular.module('articleApp',[])
    //控制器
    .controller('articleController',['$http','$scope',function ($http,$scope) {
        var self=this;
        $http.get('/session').then(function (resp) {
            // self.info=resp.data.name;
            if (resp.data){
                self.info=resp.data.name;
                $('#logining').css('display','none');
            } else {
                $('#logined').css('display','none');
                self.info='登录/注册';
            };
            checkLogin=function (){
                if(resp.data){
                    window.location='http://localhost:8803/publish';
                }else {
                    window.location='http://localhost:8803/login';
                }
            };
        });
        //论坛主页列出文章
        $http.get('/articleSession').then(function (resp) {
            var DATAStr=[];
            for (var i = 0; i < resp.data.length; i++) {
                if (resp.data[i].article_head) {
                    DATAStr[i]=resp.data[i];
                }
            }
            console.log(DATAStr);
            self.DATA=DATAStr.reverse();
        });
        //查看某一文章--通过文章题目跳转
        self.findONE = function(x) {
            $http.get('/articleofone?head='+x).then(function (resp){
                // resp.session.dataOfone=resp.data.users[0];
                window.location='http://localhost:8803/article_of_one';
        })};
    }])
    .controller('articleOfONECTR',['$http','$scope',function ($http,$scope) {
        var self=this;
        $http.get('/onearticle').then(function(resp){
            self.dataOFONE=resp.data;
        })
    }]);

angular.module('mainApp',['articleApp']);
