const moment = require('moment-timezone')
const fs = require('fs')
const chalk = require('chalk')

// Ganti @lid di teks dengan nomor yang terbaca, pakai participants jika tersedia
function resolveBodyText(text, participants = []) {
  if (!text) return text
  return text.replace(/@(\d+)/g, (match, num) => {
    // cek apakah num ini sebetulnya bagian dari lid (numeric lid)
    // cari di participants berdasarkan nomor di jid
    const found = participants.find(p => {
      const jid = p.jid || p.phoneNumber || ''
      return jid.split('@')[0] === num
    })
    if (found) return `@${found.jid?.split('@')[0] || num}`
    return match
  })
}

function printMessage(m, groupName, participants = []) {
  if (!m.message) return
  const time     = chalk.yellow(moment().tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss'))
  const rawBody  = m.text || m.mtype || ''

  // Replace @lid-like numbers dengan nomor asli dari participants
  const body = resolveBodyText(rawBody, participants)
  const msgType = chalk.cyan(body)

  // Nama: pakai pushName jika ada, fallback ke nomor dari sender (bukan lid)
  const senderNum = m.sender?.split('@')[0] || ''
  const senderName = m.pushName || senderNum || 'Unknown'
  const sender = `${chalk.green(senderName)} ${chalk.gray(`<${m.sender}>`)}`

  const location = m.isGroup
    ? `${chalk.blue('Group:')} ${chalk.yellow(groupName)} ${chalk.gray(`(${m.chat})`)}`
    : chalk.blue('Private Chat')

  console.log(
`${chalk.white('┌' + '─'.repeat(15) + '[ NEW MESSAGE ]' + '─'.repeat(16) + '┐')}
📅 ↳ ${time}
💬 ↳ ${msgType}
🙋 ↳ ${sender}
📍 ↳ ${location}
${chalk.white('└' + '─'.repeat(50) + '┘')}`
  )
}

module.exports = { printMessage }

let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(chalk.redBright(`Update ${__filename}`))
  delete require.cache[file]
  require(file)
})
