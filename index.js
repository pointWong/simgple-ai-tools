// 创建一个http服务
const http = require('http');
const router = require('./js/router')
const server = http.createServer((req, res) => {
    router(req, res);
});
server.listen(3355);
console.log('server is running in http://localhost:3355');
