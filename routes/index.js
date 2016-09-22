var express = require('express');
var router = express.Router();
var http = require("http");
var fs = require("fs");
var Wechat = require('wechat');
var WechatAPI = require('wechat-api');
var api = new WechatAPI('your appID', 'your appsecret');
var ocr = require('baidu-ocr-api').create('your appID', 'your appsecret');
var keyword = "报名参加";
var mediaPath = APP_PATH + '/media';
if (!fs.existsSync(mediaPath)) {
    fs.mkdirSync(mediaPath);
}
router.use(express.query());
router.use('/message',Wechat('testtoken', function (req, res, next) {
    var message = req.weixin;
    var wechatRes = res;
    if(message.MsgType == 'image'){
        //微信做了限制，不能直接读取，先把图片下载下来才能识别
        http.get(message.PicUrl, function(res){
            var imgData = "";
            res.setEncoding("binary"); //一定要设置response的编码为binary否则会下载下来的图片打不开
            res.on("data", function(chunk){
                imgData+=chunk;
            });
            res.on("end", function(){
                var url = mediaPath + '/' + message.FromUserName + '.png';
                fs.writeFile(url, imgData, "binary", function(err){
                    if(err){
                        console.log("down fail");
                        wechatRes.reply('截图获取失败');
                    }else{
                        ocr.scan({
                            url:url, // 支持本地路径 
                            type:'text',
                        }).then(function (data) {
                            var words = data.results.words;
                            console.log("words:" + words);
                            if(words.indexOf(keyword) > -1){
                                var text = "恭喜你报名成功！";
                            }else{
                                var text = "你拿什么图蒙我？";
                            }
                            wechatRes.reply();
                            api.sendText(message.FromUserName, text, function(result){
                                fs.unlinkSync(url);//删除本地的文件
                            });
                        }).catch(function (err) {
                            console.log('err', err);
                        })                        
                    }
                });
            });
        });
    }
}));

router.use(function(req, res, next){
    next();
});

module.exports = router;