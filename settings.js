const fs = require('fs')
const chalk = require('chalk')

global.useMongoDB = false
global.mongoURL   = 'mongodb+srv://user:password@cluster.mongodb.net/MiraMD'
global.localDBPath = './src/database.json'

global.PIRING = '12345678'

global.ownernumber = '6281248845231'
global.ownername = 'IkyyKzy'
global.fother = "© Powered by IkyyKzy "

global.prefix = ['.', '/', '!']
global.prefixMode = 'on'

global.namabot = "Mira - MD"
global.baileys = "mod"
botNumber = '12363267575'
nomorbot = '12363267575'
global.version = "1.0.0"
global.packname = 'Stick By'
global.author = 'IkyyKzy'
global.foother = 'Created By IkyyKzy'

global.mess = {
  success: 'sᴜᴄᴄᴇssғᴜʟʏ',
  admin: '[ !! ] *sʏsᴛᴇᴍ*\nᴋʜᴜsᴜs ᴀᴅᴍɪɴ ɢʀᴏᴜᴘ',
  botAdmin: '[ !! ] *sʏsᴛᴇᴍ*\nᴀᴋᴀᴍᴇ ʙᴇʟᴜᴍ ᴊᴀᴅɪ ᴀᴅᴍɪɴ',
  creator: '[ !! ] *sʏsᴛᴇᴍ*\nғᴇᴀᴛᴜʀᴇ ɪɴɪ ᴋʜᴜsᴜs ᴏᴡɴᴇʀ',
  group: '[ !! ] *sʏsᴛᴇᴍ*\nғᴇᴀᴛᴜʀᴇ ɪɴɪ ᴋʜᴜsᴜs ɢʀᴏᴜᴘ ᴀᴊᴀ',
  private: '[ !! ] *sʏsᴛᴇᴍ*\nғᴇᴀᴛᴜʀᴇ ᴋʜᴜsᴜs ᴘʀɪᴠᴀᴛᴇ ᴄʜᴀᴛ',
  wait: '[ !! ] *sʏsᴛᴇᴍ*\nᴡᴀɪᴛ ᴀᴋᴀᴍᴇ ᴘʀᴏsᴇs ᴅᴜʟᴜ',
  premium: '[ !! ] *sʏsᴛᴇᴍ*\nғᴇᴀᴛᴜʀᴇ ᴋʜᴜsᴜs ᴘʀᴇᴍɪᴜᴍ',
}

global.closeMsgInterval = 30
global.backMsgInterval = 2

let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(chalk.redBright(`Update ${__filename}`))
  delete require.cache[file]
  require(file)
})
