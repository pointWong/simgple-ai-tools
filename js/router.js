
const routes = require('./routes.js')
module.exports = async function (req, res) {
  const url = req.url
  switch (true) {
    case /^\/wssay\/scaning-website/.test(url):
      routes.scanWebsite(req, res)
      break;
    case /^\/wssay\/ask-some-question/.test(url):
      routes.askQuestion(req, res)
      break
    case /^\/wssay\/translate-single-word/.test(url):
      routes.translate(req, res)
      break
    case /[.]*\.(css|js|html)/.test(url):
      routes.sendAssets(req, res)
      break
    case /^\/$/.test(url):
      routes.home(res)
      break;
    default:
      routes.noFound(res)
  }
}