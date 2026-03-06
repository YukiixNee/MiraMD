const fs = require('fs')
const chalk = require('chalk')
const { color } = require('./color')

async function uncache(module = '.') {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(module)]
      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

async function nocache(module, cb = () => { }) {
  console.log(color('Module', 'blue'), color(`'${module} is up to date!'`, 'cyan'))
  fs.watchFile(require.resolve(module), async () => {
    await uncache(require.resolve(module))
    cb(module)
  })
}

module.exports = { uncache, nocache }

let file = require.resolve(__filename)
fs.watchFile(file, () => {{
  fs.unwatchFile(file)
  console.log(chalk.redBright(`Update ${{__filename}}`))
  delete require.cache[file]
  require(file)
}})
