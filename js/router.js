
const routes = require('./routes.js')
module.exports = async function (req, res) {
  const url = req.url
  switch (true) {
    case /^\/wssay\/api\/scaning-website/.test(url):
      routes.scanWebsite(req, res)
      break;
    case /^\/wssay\/api\/ask-some-question/.test(url):
      routes.askQuestion(req, res)
      break
    case /^\/wssay\/api\/translate/.test(url):
      routes.translate(req, res)
      break
    case /[.]*\.(css|js|html)/.test(url):
      routes.sendAssets(req, res)
      break
    case /^\/wssay\/?/.test(url):
      routes.home(res)
      break
    case /^\/$/.test(url):
      routes.home(res)
      break;
    default:
      routes.noFound(res)
  }
}