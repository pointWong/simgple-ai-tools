const { extractTextFromHTML, extractLinks, sleep, joinUrl } = require("./util")
const https = require('https');
const http = require('http')
const { sendMessageXfxhForSumerize } = require("./xfhxAi");

const URL = require('url');
const { msSumarize } = require("./moonshot");
let urlorigin
let linksList = []
let urlInContent = []
let diglevel = 0
let lang = 'zh-cn'

async function start (url, level = 0, language) {
  lang = language
  url = (url.startsWith('https://') || url.startsWith('http://')) ? url : 'https://' + url
  const dd = URL.parse(url)
  urlorigin = (dd.protocol || 'https') + '//' + dd.host
  linksList = []//清空
  diglevel = 0
  let content = await requestStart(url, level)
  res = await extractMainContent(content)
  return res || content
}

async function extractMainContent (content) {
  let result = ''
  result = await msSumarize({ message: content }) //moonshot
  if (result) return result
  result = await sendMessageXfxhForSumerize(content) // 讯飞星火
  return result
}

async function requestStart (url, level) {
  let content = ''
  try {
    const res = await request(url, urlorigin)
    content += extractTextFromHTML(res) // 提取出文本内容
    const linksInContent = extractLinks(res) //从内容中提取出所有链接
    urlInContent = [...urlInContent, ...linksInContent].reduce((acc, cur) => {
      if (linksList.indexOf(cur) === -1 && acc.indexOf(cur) == -1) {
        acc.push(cur)
      }
      return acc
    }, [])
    if (diglevel >= level) {
      urlInContent = []
      return content
    }
    linksList = [].concat(linksInContent, linksList)
    if (urlInContent.length) {
      await sleep(Math.random() * 1000)
      const copyUrlInContent = JSON.parse(JSON.stringify(urlInContent))
      urlInContent = []
      content += await requestUrlBatch(copyUrlInContent)
      linksList = [].concat(linksInContent, linksList)
      diglevel++
      urlInContent.reduce((acc, item) => {
        if (acc.indexOf(item) === -1) {
          acc.push(item)
        }
        return acc
      }, [])
      if (urlInContent.length) {
        content += await requestStart(urlInContent.shift(), level)
      }
    }
  } catch (error) {
    console.log("🚀 ~ error ~ error:", error)
  }
  return content
}

async function requestUrlBatch (urls) {
  let content = ''
  try {
    const p = urls.splice(0, 10).map(async (url) => {
      await sleep(Math.random() * 1000)
      return await request(url, urlorigin)
    })
    const result = await Promise.allSettled(p)
    const allp = result.filter(p => p.status === 'fulfilled').map(p => p.value)
    allp.forEach(item => {
      content += extractTextFromHTML(item)
      const linksInContent = extractLinks(item) //从内容中提取出所有链接
      urlInContent = [...urlInContent, ...linksInContent].reduce((acc, cur) => {
        if (linksList.indexOf(cur) === -1 && acc.indexOf(cur) == -1) {
          acc.push(cur)
        }
        return acc
      }, [])
    })
    if (urls.length) {
      await sleep(Math.random() * 1000)
      content += await requestUrlBatch(urls)
    }
  } catch (error) {
    console.log("🚀 ~ requestUrlBatch ~ error:", error)
  }
  return content
}

async function request (url, urlorigin) {
  url = (url.startsWith('http') || url.startsWith('https')) ? url : joinUrl(urlorigin, url)
  let content = ''
  try {
    content = await requestByhttp(url)
  } catch (error) {
    console.log("🚀 ~ request ~ error1:", error)
  }
  return content
}

// node实现一个根据url请求的函数
function requestByhttp (url) {
  return new Promise((resolve, reject) => {
    const rq = url.startsWith('https') ? https : http;
    rq.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      })
      res.on('end', () => {
        resolve(data);
      })
    }).on('error', (error) => {
      reject(error);
    })
  })
}

module.exports = {
  start
}