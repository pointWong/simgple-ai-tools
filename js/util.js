const cheerio = require('cheerio');
const querystring = require('querystring');

// 通过url设置相应头content-type
function setContentTypeByUrl (url) {
  if (url.endsWith('.js')) {
    return 'application/javascript'
  } else if (url.endsWith('.css')) {
    return 'text/css'
  } else {
    return 'text/html'
  }
}

function getUrlParams (url) {
  return querystring.decode(url.split('?')[1])
}

async function readRequestBody (req) {
  const data = [];
  // 读取请求体的流
  for await (const chunk of req) {
    data.push(chunk);
  }
  // 将Buffer数组转换为字符串，并尝试解析为JSON
  const buffer = Buffer.concat(data);
  return JSON.parse(buffer.toString());
}

function joinUrl (url1, url2) {
  if ((url1.endsWith('/') && !url2.startsWith('/')) || (!url1.endsWith('/') && url2.startsWith('/'))) {
    return url1 + url2
  }
  if (url1.endsWith('/') && url2.endsWith('/')) {
    return url1 + url2.slice(1)
  }
  return url1 + '/' + url2
}

function extractTextFromHTML (html, custom) {
  // 使用cheerio加载HTML字符串
  const $ = cheerio.load(html);
  if (custom) {
    return custom($)
  }
  // 使用cheerio选择器选取所有的文本节点
  const textNodes = $('*')
    .contents()
    .filter(function () {
      return this.type === 'text' && this.parentNode.name != 'script' && this.parentNode.name != 'style' && this.parentNode.name != 'head' && this.parentNode.name != 'title' && this.parentNode.name != 'meta';
    });

  // 提取文本节点的内容
  let text = '';
  textNodes.each(function (index, element) {
    let thistext = $(this).text().replace(/[\r\n\s]/g, '')
    if (!!thistext) {
      text += thistext;
      text += '\n'
    }
  });
  return text;
}

function extractLinks (html) {
  const $ = cheerio.load(html);
  const links = [];

  $('a').each((i, link) => {
    const href = $(link).attr('href');
    if (href && /(((http|https):\/\/)?(www\.)?.+\..+)|(\.?\/?(\/.)+)/.test(href) && !(/((http|https):\/\/)?beian\.miit\.gov\.cn\/?/.test(href))) {
      links.push(href);
    }
  });
  return links;
}

function sleep (du = 1000) {
  return new Promise(resolve => setTimeout(resolve, du))
}

module.exports = {
  setContentTypeByUrl, getUrlParams, readRequestBody, extractTextFromHTML, extractLinks, sleep, joinUrl
}