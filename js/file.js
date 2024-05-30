const fs = require('fs')

function readFile (path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });
}
function writeFile (path, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, (err) => {
      if (err) reject(err);
      resolve();
    });
  });
}
module.exports = {
  readFile,
  writeFile
}