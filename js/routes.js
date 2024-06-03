const path = require('path');
const { readFile } = require("./file")
const { setContentTypeByUrl, readRequestBody, getUrlParams } = require('./util');
const { start } = require('./request.js');
const { answerFromXfxh, translateViaXfxh } = require('./xfhxAi.js');
const { translateViaMs, answerFromMs } = require('./moonshot.js');

async function home (res) {
  try {
    const homeHtml = await readFile('./html/home.html')
    res.writeHeader(200, { 'Content-Type': 'text/html' });
    res.end(homeHtml)
  } catch (error) {
  }
}

async function sendAssets (req, res) {
  try {
    const url = req.url.replace('/wssay','');
    const filepath = path.join(process.cwd(), url);
    const content = await readFile(filepath)
    res.writeHead(200, { "content-type": setContentTypeByUrl(url) })
    res.end(content)
  } catch (error) {
  }
}

async function scanWebsite (req, res) {
  const lang = req.headers['accept-language'].split(',')[0]
  const row = await readRequestBody(req)
  const { url } = row
  const content = await start(url, 0, lang)
  res.writeHead(200, { "content-type": "application/json" })
  res.end(JSON.stringify({ content: content }))
}
async function askQuestion (req, res) {
  if (req.method !== 'POST') {
    notAllowed(res)
    return
  }
  const row = await readRequestBody(req)
  const { content } = row
  const response = await waitAnswer(content, req.headers.host)
  res.writeHead(200, { "content-type": "application/json" })
  res.end(JSON.stringify({ isOk: true, content: response }))
}

async function waitAnswer (content, host) {
  let result = ''
  result = await answerFromMs({ message: content })
  if (result) return result
  result = await answerFromXfxh(content, host)
  return result
}

async function translate (req, res) {
  if (req.method !== 'GET') {
    notAllowed(res)
    return
  }
  const row = getUrlParams(req.url)
  const { content, target, lang } = row
  const { host } = req.headers
  const response = await awaitTranslate({ message: content, target, lang, hostname: host })
  res.writeHead(200, { "content-type": "application/json" })
  res.end(JSON.stringify({ isOk: true, content: response }))
}

async function awaitTranslate (options) {
  console.log("🚀 ~ translate ~ options:", options)
  let response = await translateViaMs(options)
  if (response) return response
  response = await translateViaXfxh(options)
  if (response) return response
  return ""
}

function noFound (res) {
  res.end('404 Not Found')
}
function notAllowed (res) {
  res.end('405 Not Allowed')
}
module.exports = {
  home,
  scanWebsite,
  noFound,
  sendAssets,
  askQuestion,
  translate
}