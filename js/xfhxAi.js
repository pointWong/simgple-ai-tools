// 地址必须填写，代表着大模型的版本号！！！！！！！！！！！！！！！！ 
// let httpUrl = new URL("https://spark-api.xf-yun.com/v3.1/chat");
let httpUrl = new URL("wss://spark-api.xf-yun.com/v1.1/chat");
let modelDomain; // V1.1-V3.5动态获取，高于以上版本手动指定
//APPID，APISecret，APIKey在https://console.xfyun.cn/services/cbm这里获取
const { APPID, API_SECRET, API_KEY } = require("../.xfhx-config.js");
const CryptoJS = require('crypto-js')
var btoa = require('btoa');
const { sleep } = require("./util.js");
var host = 'localhost:3355'

function getWebsocketUrl () {
  // console.log(httpUrl.pathname)
  // 动态获取domain信息
  switch (httpUrl.pathname) {
    case "/v1.1/chat":
      modelDomain = "general";
      break;
    case "/v2.1/chat":
      modelDomain = "generalv2";
      break;
    case "/v3.1/chat":
      modelDomain = "generalv3";
      break;
    case "/v3.5/chat":
      modelDomain = "generalv3.5";
      break;
  }

  return new Promise((resolve, reject) => {
    var apiKey = API_KEY
    var apiSecret = API_SECRET
    var url = 'wss://' + httpUrl.host + httpUrl.pathname
    var date = new Date().toGMTString()
    var algorithm = 'hmac-sha256'
    var headers = 'host date request-line'
    var signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${httpUrl.pathname} HTTP/1.1`
    var signatureSha = CryptoJS.HmacSHA256(signatureOrigin, apiSecret)
    var signature = CryptoJS.enc.Base64.stringify(signatureSha)
    var authorizationOrigin = `api_key="${apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`
    var authorization = btoa(authorizationOrigin)
    url = `${url}?authorization=${authorization}&date=${date}&host=${host}`
    resolve(url)
  })
}

const WebSocketClient = require('websocket').client
let socket
let socketConnection
function connectSocket () {
  return new Promise(async (resolve, reject) => {
    try {
      socket = new WebSocketClient()
      socket.on('connectFailed', function (err) {
      })
      socket.on('connect', function (connection) {
        console.log('WebSocket socket Connected');
        connection.on('error', function (error) {
          console.log("Connection Error: " + error.toString());
        });
        connection.on('close', function () {
          console.log('echo-protocol Connection Closed');
        });
        connection.on('message', function (message) {
          if (message.type === 'utf8') {
            getMessages(message.utf8Data)
          }
        });
        socketConnection = connection
        resolve()
      })
      url = await getWebsocketUrl()
      socket.connect(url)
    } catch (error) {
    }
  })
}

let originMessage = []
let messageLen = 0
function getMessages (str) {
  const item = JSON.parse(str)
  if (item.header && item.header.code === 0) {
    originMessage.push(JSON.parse(JSON.stringify(item)))
  }
}

async function waitForResponse () {
  if (messageLen === originMessage.length) {
    const content = originMessage.map(item => {
      if (item.payload && item.payload.choices && item.payload.choices.text && item.payload.choices.text.length) {
        return item.payload.choices.text.map(si => si.content || '').join('')
      } else {
        return ''
      }
    }).join('')
    return content
  } else {
    messageLen = originMessage.length
    await sleep(3000)
    return waitForResponse()
  }
}
// 翻译
async function translateViaXfxh ({ message, target, lang = '中文', hostname }) {
  const prompt = `你现在是个翻译家，你将会精确翻译我提供给你的文本，我需要你将${lang || "中文"}翻译成${target || "英文"},你只需告诉我翻译结果，无需其他描述，现在需要你翻译的第一段文本是：${message}`
  // { "role": "user", "content": message }
  console.log("🚀 ~ translateViaXfxh ~ prompt:", prompt)
  const content = await sendMessageToXfxh([{ "role": "user", "content": prompt }], hostname)
  // return content.replace(/[\u4E00-\u9FA5`~!@#$%^&*()_+=<>?:"{}|,.\/;'\\[\]·~！@#￥%……&*（）——+={}|《》？：“”【】、；‘'，。、]/g,'').trim()
  return content
}
// 问答
async function answerFromXfxh (message, hostname) {
  return await sendMessageToXfxh([{ "role": "user", "content": message }], hostname)
}
// 从html中提取重要信息
async function extractMainContentViaXfhx (message) {
  const prompt = `你是一个文案整理高手，你将会根据我提供的杂乱的文本中整理出主要内容并详细列举出来，然后告诉我结果，现在我需要你整理的第一段文本是： \n ${message}`
  return await sendMessageToXfxh([{ "role": "user", "content": prompt }])
}

async function sendMessageToXfxh (messages, hostname) {
  if (!socketConnection || !socketConnection.connected) {
    if (hostname) host = hostname
    socket && (socket = null)
    socketConnection && (socketConnection = null)
    await sleep(1000)
    await connectSocket()
  }
  originMessage = []
  var params = {
    "header": {
      "app_id": APPID, "uid": "fd3f47e4-d"
    },
    "parameter": {
      "chat": {
        "domain": modelDomain, "temperature": 0.5, "max_tokens": 4096
      }
    },
    "payload": {
      "message": {
        //   "text": [
        //     {
        //     "role": "user", "content": "中国第一个皇帝是谁？"
        //   }, 
        //   {
        //     "role": "assistant", "content": "秦始皇"
        //   }, 
        //   {
        //     "role": "user", "content": "秦始皇修的长城吗"
        //   }, 
        //   {
        //     "role": "assistant", "content": "是的"
        //   }, 
        //   {
        //     "role": "user", "content": "秦始皇是谁？"
        //   },
        //   {
        //     "role": "user", "content": "秦始皇哪一年死的？"
        //   }
        // ]
        "text": messages
      }
    }
  }
  socketConnection.send(JSON.stringify(params))
  await sleep(2000)
  const res = await waitForResponse()
  return res
}

module.exports = {
  sendMessageToXfxh,
  translateViaXfxh,
  answerFromXfxh,
  extractMainContentViaXfhx
}