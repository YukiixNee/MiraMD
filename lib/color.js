const fs = require('fs')
const chalk = require('chalk')

const color = (text, color) => {
  return !color ? chalk.green(text) : chalk.keyword(color)(text)
}

const bgcolor = (text, bgcolor) => {
  return !bgcolor ? chalk.bgGreen.bold(text) : chalk.bgKeyword(bgcolor).bold(text)
}

module.exports = { color, bgcolor }

let file = require.resolve(__filename)
fs.watchFile(file, () => {{
  fs.unwatchFile(file)
  console.log(chalk.redBright(`Update ${{__filename}}`))
  delete require.cache[file]
  require(file)
}})
