require('../settings')

const moment = require('moment-timezone')
const fs = require('fs')
const chalk = require('chalk')
const {
  default: DimzBotConnect,
  delay,
  jidNormalizedUser,
  makeWASocket,
  generateForwardMessageContent,
  prepareWAMessageMedia,
  generateWAMessageFromContent,
  generateMessageID,
  jidDecode,
  proto,
} = require('baileys')

const userDbPath = `${process.cwd()}/database/user.json`
const users = JSON.parse(fs.readFileSync(userDbPath, 'utf-8'))

const time2 = moment().tz('Asia/Jakarta').format('HH:mm:ss')
let timewisher

if (time2 < '05:00:00') {
  timewisher = '🌃 Selamat Pagi'
} else if (time2 < '11:00:00') {
  timewisher = '☀️ Selamat Pagi'
} else if (time2 < '15:00:00') {
  timewisher = '🌞 Selamat Siang'
} else if (time2 < '18:00:00') {
  timewisher = '🌇 Selamat Sore'
} else if (time2 < '19:00:00') {
  timewisher = '🌆 Selamat Malam'
} else {
  timewisher = '🌙 Selamat Malam'
}

const handleIncomingMessage = (sock, id) => {}

const saveUsers = () => {
  fs.writeFileSync(userDbPath, JSON.stringify(users, null, 4))
}

module.exports = { handleIncomingMessage }

let file = require.resolve(__filename)
fs.watchFile(file, () => {{
  fs.unwatchFile(file)
  console.log(`Update ${{__filename}}`)
  delete require.cache[file]
  require(file)
}})
