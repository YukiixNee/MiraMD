require('./settings')

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  delay,
  Browsers,
  makeCacheableSignalKeyStore,
  jidDecode,
} = require('baileys')

const {
  chalk, FileType, path, PhoneNumber, axios, moment, util,
  readline, lodash: _, figlet, gradient, childProcess,
} = require('#modul')
const yargs = require('yargs/yargs')
const fs = require('fs')
const NodeCache = require('node-cache')

const { makeInMemoryStore } = require('./lib/store/')
const { tanggal, day, bulan, tahun, weton, smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, sleep, reSize } = require('./lib/myfunc')
const { attachToConn } = require('./lib/simple')
const { color, bgcolor } = require('./lib/color')
const { uncache, nocache } = require('./lib/loader')
const { handleIncomingMessage } = require('./lib/user')
const { printMessage } = require('./lib/print')

const Pino = require('pino')

const { initDatabase } = require('./lib/database')
const more = String.fromCharCode(8206)
const readmore = more.repeat(4001)
const prefix = ''
const type = (x) => x?.constructor?.name || (x === null ? 'null' : 'undefined')
const isStringSame = (x, y) => (Array.isArray(y) ? y.includes(x) : y === x)
const buttonTypes = []

const store = makeInMemoryStore({
  logger: Pino().child({
    level: 'silent',
    stream: 'store',
  }),
})

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())

let phoneNumber = `${nomorbot}`
const pairingCode = false

const question = (text) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  return new Promise((resolve) => {
    rl.question(text, resolve)
  })
}

async function startsesi() {
  const { saveCreds, state } = await useMultiFileAuthState(`./session`)
  const msgRetryCounterCache = new NodeCache()

  const syncKeys = async () => {
    try {
      await saveCreds(state.creds)
    } catch (err) {
      console.error('Key synchronization failed:', err)
    }
  }

  const conn = makeWASocket({
    logger: Pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.macOS('Safari'),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: 'silent' })),
    },
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: false,
    getMessage: async (key) => {
      let jid = jidNormalizedUser(key.remoteJid)
      let msg = await store.loadMessage(jid, key.id)
      return msg?.message || ''
    },
    msgRetryCounterCache,
  })

  syncKeys()

  if (store) {
    store.bind(conn.ev)
  }

  attachToConn(conn, store)

  conn.ev.on('creds.update', saveCreds)

  if (!conn.authState.creds.registered) {
    console.log('Waiting Get Your Pairing')
    const number = phoneNumber
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
    await delay(6000)
    const code = await conn.requestPairingCode(number, global.PIRING)
    console.log(
      chalk.black(chalk.bgGreen(`Your Pairing : `)),
      chalk.black(chalk.white(code)),
    )
  }

  conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      if (lastDisconnect.error.output.statusCode == DisconnectReason.loggedOut) {}
      startsesi()
    }
  })

  conn.ev.on('group-participants.update', async (anu) => {})

  const callCount = {}

  conn.ev.on('call', async (calls) => {
    const botJid = conn.user?.jid || conn.user?.id
    const settings = global.db?.data?.settings?.[botJid] || {}
    if (!settings.anticall) return

    for (const call of calls) {
      if (call.status !== 'offer') continue

      await conn.rejectCall(call.id, call.from)

      const caller = call.from
      callCount[caller] = (callCount[caller] || 0) + 1

      if (callCount[caller] >= 3) {
        await conn.updateBlockStatus(caller, 'block')
        delete callCount[caller]
        await conn.sendMessage(caller, {
          text: `🚫 Kamu telah di-block karena menelepon bot sebanyak 3x.`
        })
      } else {
        await conn.sendMessage(caller, {
          text: `❌ Bot tidak bisa menerima panggilan. Peringatan ${callCount[caller]}/3 — 3x akan otomatis di-block.`
        })
      }
    }
  })

  conn.ev.on('messages.upsert', async (chatUpdate) => {
    try {
      const kay = chatUpdate.messages[0]
      if (!kay?.message) return

      kay.message = Object.keys(kay.message)[0] === 'ephemeralMessage'
        ? kay.message.ephemeralMessage.message
        : kay.message

      const m = smsg(conn, kay, store)
      if (!m) return

      const botJid   = conn.decodeJid(conn.user.id)
      const settings = global.db?.data?.settings?.[botJid] || {}
      const isOwner  = global.ownernumber?.includes(m.sender.split('@')[0]) || botJid === m.sender

      if (!isOwner) {
        if (!(settings.public ?? true) && !kay.key.fromMe && chatUpdate.type === 'notify') return
        if (settings.gconly && !m.isGroup) return
        if (settings.pconly &&  m.isGroup) return
      }

      if (settings.autoread) await conn.readMessages([kay.key]).catch(() => {})

      if (!conn.public && !(
        kay.key.fromMe ||
        global.ownernumber?.includes(kay.key.participant?.split('@')[0]) ||
        global.ownernumber?.includes(m.sender.split('@')[0]) ||
        botJid === m.sender
      ) && chatUpdate.type === 'notify') return

      if (kay.key.id?.startsWith('BAE5') && kay.key.id.length === 16) return

      if (kay.key?.remoteJid === 'status@broadcast') {
        await conn.readMessages([kay.key])
        if (!kay.message?.reactionMessage && Date.now() - kay.messageTimestamp * 1000 <= 5 * 60 * 1000) {
          const emojis = ['😺','😸','😻','😼','🙀','😿','😾','😂','🤣','😃','😄','😅','😆','😉','😊','🥰','😍','😘','😗','😚','😋','😜','😝','😛','🤑','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😏','😣','😖','😫','😩','😢','😭','😤','😠','😡','🤬','😱','😨','😰','😥','😓','😳','🤯','😵','😵‍💫','😷','🤒','🤕','😈','👿','🐱','🐶','🐼','🐦','🐇','🫩','👍','🥱','💩','👺','💀','👌','👎','🐔','🤮','🤓','🫣','🤤','🤝','👻','🫶','😇','🥳','🙃','🗿','🇮🇩']
          await conn.sendMessage('status@broadcast',
            { react: { text: emojis[Math.floor(Math.random() * emojis.length)], key: kay.key } },
            { statusJidList: store.contacts ? Object.keys(store.contacts).filter(j => j.endsWith('@s.whatsapp.net')) : [kay.key.participant] }
          )
        }
        return
      }

      if (!m.key.fromMe && m.key.remoteJid?.endsWith('@s.whatsapp.net') && m.text) {
        handleIncomingMessage(conn, m.key.remoteJid)
      }

      require('./command/case')(conn, m, chatUpdate, store)
    } catch (err) {
      console.error('Error saat memproses pesan:', err)
    }
  })

  conn.ev.on('messages.update', async (chatUpdate) => {
    for (const { key, update } of chatUpdate) {
      if (update.pollUpdates && key.fromMe) {
        const pollCreation = await getMessage(key)
        if (pollCreation) {
          const pollUpdate = await getAggregateVotesInPollMessage({
            message: pollCreation,
            pollUpdates: update.pollUpdates,
          })
          var toCmd = pollUpdate.filter((v) => v.voters.length !== 0)[0]?.name
          if (toCmd == undefined) return
          var prefCmd = prefix + toCmd
          conn.appenTextMessage(prefCmd, chatUpdate)
        }
      }
    }
  })


  return conn
}

initDatabase().then(() => startsesi())

let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(chalk.redBright(`Update ${__filename}`))
  delete require.cache[file]
  require(file)
})
