require('../settings')

const {
    generateWAMessage,
    proto,
    areJidsSameUser,
    getContentType,
} = require('baileys')
const { modul } = require('#modul') 
const { chalk, moment, axios, fs, util, childProcess } = modul
const path = require('path') 
const { exec } = childProcess
const { color } = require('../lib/color')
const { delay } = require('baileys')
const {
    clockString, parseMention, resolveMentions, formatp, isUrl, sleep, runtime, getBuffer, jsonformat, format, capital, reSize, generateProfilePicture
} = require('../lib/myfunc')
const { printMessage } = require('../lib/print')
const { pluginsLoader, matchCommand } = require('../lib/plugin')
const { loadDatabase } = require('../lib/database')
const Ai4Chat = require('../src/scrape/Ai4Chat')

const readFile = util.promisify(fs.readFile)
const more = String.fromCharCode(8206)
const readmore = more.repeat(4001)

module.exports = async (conn, m, chatUpdate, store) => {
    try {
        async function appenTextMessage(text, chatUpdate) {
            let messages = await generateWAMessage(
                m.chat,
                { text: text, mentions: m.mentionedJid },
                { userJid: conn.user.id, quoted: m.quoted && m.quoted.fakeObj },
            )
            messages.key.fromMe = areJidsSameUser(m.sender, conn.user.id)
            messages.key.id = m.key.id
            messages.pushName = m.pushName
            if (m.isGroup) messages.participant = m.sender
            let msg = {
                ...chatUpdate,
                messages: [proto.WebMessageInfo.fromObject(messages)],
                type: 'append',
            }
            conn.ev.emit('messages.upsert', msg)
        }

        const { type, quotedMsg, mentioned, now, fromMe } = m
        let body =
            m.mtype === 'interactiveResponseMessage'
                ? JSON.parse(m.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson).id
                : m.mtype === 'conversation'
                    ? m.message.conversation
                    : m.mtype == 'imageMessage'
                        ? m.message.imageMessage.caption
                        : m.mtype == 'videoMessage'
                            ? m.message.videoMessage.caption
                            : m.mtype == 'extendedTextMessage'
                                ? m.message.extendedTextMessage.text
                                : m.mtype == 'buttonsResponseMessage'
                                    ? m.message.buttonsResponseMessage.selectedButtonId
                                    : m.mtype == 'listResponseMessage'
                                        ? m.message.listResponseMessage.singleSelectReply.selectedRowId
                                        : m.mtype == 'templateButtonReplyMessage'
                                            ? m.message.templateButtonReplyMessage.selectedId
                                            : m.mtype == 'messageContextInfo'
                                                ? m.message.buttonsResponseMessage?.selectedButtonId ||
                                                  m.message.listResponseMessage?.singleSelectReply.selectedRowId ||
                                                  m.text
                                                : m.mtype === 'editedMessage'
                                                    ? m.message.editedMessage.message.protocolMessage.editedMessage.extendedTextMessage
                                                        ? m.message.editedMessage.message.protocolMessage.editedMessage.extendedTextMessage.text
                                                        : m.message.editedMessage.message.protocolMessage.editedMessage.conversation
                                                    : ''

        loadDatabase(m, conn)

        const premium = global.db?.data?.premium || []

        const boys = typeof m.text === 'string' ? m.text : ''
        const budy = boys
        const PREFIXES = ['.', '/', '!']
        const botNumber = await conn.decodeJid(conn.user.id)
        const isCreator = [
            ...(global.ownerlist || []),
            conn.user.id
        ]
            .map(v => v.toString().replace(/[^0-9]/g, '') + '@s.whatsapp.net')
            .includes(m.sender)

        const usedPrefix = PREFIXES.find(p => boys.startsWith(p)) || ''
        const hasPrefix = usedPrefix !== ''
        const isCmd = hasPrefix || isCreator
        const prefix = usedPrefix || PREFIXES[0]

        const chath = boys
        const pes = boys
        const messagesC = pes.slice(0).trim()
        const content = JSON.stringify(m.message)
        const from = m.chat
        const command = isCmd
            ? boys.slice(usedPrefix.length).trim().split(/ +/).shift().toLowerCase()
            : ''
        const args = boys.slice(usedPrefix.length).trim().split(/ +/).slice(1)

        const pushname = m.pushName || 'Nothing'
        const text = (q = args.join(' '))
        const quoted = m.quoted ? m.quoted : m
        const mime = (quoted.msg || quoted).mimetype || ''
        const qmsg = quoted.msg || quoted
        const isMedia = /image|video|sticker|audio/.test(mime)
        const isImage = type == 'imageMessage'
        const isVideo = type == 'videoMessage'
        const isAudio = type == 'audioMessage'
        const isSticker = type == 'stickerMessage'
        const isQuotedImage = type === 'extendedTextMessage' && content.includes('imageMessage')
        const isQuotedLocation = type === 'extendedTextMessage' && content.includes('locationMessage')
        const isQuotedVideo = type === 'extendedTextMessage' && content.includes('videoMessage')
        const isQuotedSticker = type === 'extendedTextMessage' && content.includes('stickerMessage')
        const isQuotedAudio = type === 'extendedTextMessage' && content.includes('audioMessage')
        const isQuotedContact = type === 'extendedTextMessage' && content.includes('contactMessage')
        const isQuotedDocument = type === 'extendedTextMessage' && content.includes('documentMessage')
        const sender = m.sender
        const senderNumber = sender.split('@')[0]
        const groupMetadata = m.isGroup ? await conn.groupMetadata(m.chat).catch(() => null) : null
        const participants = (groupMetadata ? groupMetadata.participants || [] : []).map(p => {
            const fullJid = p.jid
                || p.phoneNumber
                || (p.id && !p.id.endsWith('@lid') ? p.id : null)
                || p.id
            return { ...p, jid: fullJid }
        })
        const groupAdmins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin').map(p => p.jid)
        const groupName = groupMetadata ? groupMetadata.subject : ''
        const groupOwner = groupMetadata ? (groupMetadata.owner || '') : ''
        const groupOwnerLid = groupMetadata ? (groupMetadata.ownerLid || '') : ''
        const isBotAdmins = m.isGroup ? groupAdmins.includes(botNumber) : false
        const isGroupAdmins = m.isGroup ? groupAdmins.includes(m.sender) : false
        const isAdmins = isGroupAdmins
        const isPremium = premium.includes(m.sender)
        const mentionByTag = resolveMentions(m.mentionedJid, boys, participants)
        const mentionByReply = m.quoted?.sender || ''
        const mentionUser = [...new Set([...mentionByTag, ...(m.quoted ? [m.quoted.sender] : [])])].filter(Boolean)
        const numberQuery = q.replace(/[()\-+\s/]/g, '') + '@s.whatsapp.net'
        const usernya = mentionByReply || mentionByTag[0]
        const Input = mentionByTag[0] || mentionByReply || (q ? numberQuery : false)

        const xtime = moment.tz('Asia/Jakarta').format('HH:mm:ss')
        const xdate = moment.tz('Asia/Jakarta').format('DD/MM/YYYY')
        const time2 = moment().tz('Asia/Jakarta').format('HH:mm:ss')

        let timewisher
        if (time2 < '23:59:00') timewisher = 'Selamat Malam'
        if (time2 < '19:00:00') timewisher = 'Selamat Malam'
        if (time2 < '18:00:00') timewisher = 'Selamat Sore'
        if (time2 < '15:00:00') timewisher = 'Selamat Siang'
        if (time2 < '11:00:00') timewisher = 'Selamat Pagi'
        if (time2 < '05:00:00') timewisher = 'Selamat Pagi'

        let sekarang = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))

        function tanggal(ms) { return new Date(ms).getDate().toString().padStart(2, '0') }
        function bulan(ms) { return (new Date(ms).getMonth() + 1).toString().padStart(2, '0') }
        function tahun(ms) { return new Date(ms).getFullYear() }
        function formatJam(date) {
            let jam = date.getHours().toString().padStart(2, '0')
            let menit = date.getMinutes().toString().padStart(2, '0')
            let detik = date.getSeconds().toString().padStart(2, '0')
            return `${jam}:${menit}:${detik}`
        }

        let futureDescription = `
📅 *Update Kurs:* ${tanggal(sekarang.getTime())}/${bulan(sekarang.getTime())}/${tahun(sekarang.getTime())}
🕰 *Waktu Jakarta (WIB):* ${formatJam(sekarang)}`

        const qtext = { key: { remoteJid: 'status@broadcast', participant: '0@s.whatsapp.net' }, message: { "extendedTextMessage": { "text": `${usedPrefix + command}` } } }
        const qbug = { key: { remoteJid: 'status@broadcast', fromMe: false, participant: '0@s.whatsapp.net' }, message: { listResponseMessage: { title: `ꪎ ${global.ownername}` } } }
        const qdoc = { key: { participant: '0@s.whatsapp.net', ...(m.chat ? { remoteJid: `status@broadcast` } : {}) }, message: { documentMessage: { title: `ꪎ ${global.ownername}`, jpegThumbnail: '' } } }
        const qloc = { key: { participant: '0@s.whatsapp.net', ...(m.chat ? { remoteJid: `status@broadcast` } : {}) }, message: { locationMessage: { name: `ꪎ ${global.ownername}`, jpegThumbnail: '' } } }
        const qloc2 = { key: { participant: '0@s.whatsapp.net', ...(m.chat ? { remoteJid: `status@broadcast` } : {}) }, message: { locationMessage: { name: `ꪎ ${global.ownername}`, jpegThumbnail: '' } } }
        const qpayment = { key: { remoteJid: '0@s.whatsapp.net', fromMe: false, id: `ownername`, participant: '0@s.whatsapp.net' }, message: { requestPaymentMessage: { currencyCodeIso4217: 'USD', amount1000: 999999999, requestFrom: '0@s.whatsapp.net', noteMessage: { extendedTextMessage: { text: 'Simple Bot' } }, expiryTimestamp: 999999999, amount: { value: 91929291929, offset: 1000, currencyCode: 'USD' } } } }
        const qtoko = { key: { fromMe: false, participant: `0@s.whatsapp.net`, ...(m.chat ? { remoteJid: 'status@broadcast' } : {}) }, message: { "productMessage": { "product": { "productImage": { "mimetype": "image/jpeg", "jpegThumbnail": "" }, "title": `ꪎ ${global.ownername}`, "description": null, "currencyCode": "IDR", "priceAmount1000": "999999999999999", "retailerId": `ꪎ ${global.ownername}`, "productImageCount": 1 }, "businessOwnerJid": `0@s.whatsapp.net` } } }
        const qlive = { key: { participant: '0@s.whatsapp.net', ...(m.chat ? { remoteJid: `status@broadcast` } : {}) }, message: { liveLocationMessage: { caption: `ꪎ ${global.ownername}`, jpegThumbnail: '' } } }

        async function reply(txt) {
            const MiraNee = {
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterName: `Information With ${namabot}`,
                        newsletterJid: `120363424215170823@newsletter`,
                    },
                    externalAdReply: {
                        showAdAttribution: false,
                        title: `— ${namabot} `,
                        body: '',
                        thumbnailUrl: `https://cdn.nekohime.site/file/gEC0yb3k.jpeg`,
                        sourceUrl: "",
                    },
                },
                text: txt,
            }
            return conn.sendMessage(m.chat, MiraNee, { quoted: m })
        }
        m.reply = reply

        m.replyRaw = (text, chatId = m.chat, options = {}) =>
          Buffer.isBuffer(text)
            ? conn.sendMedia(chatId, text, 'file', '', m, { ...options })
            : conn.sendText(chatId, text, m, { ...options })

        const reply2 = (teks) => {
            conn.sendMessage(from, { text: teks }, { quoted: m })
        }

        const example = (teks) => {
            return `\n *Contoh Penggunaan :*\n Ketik *${usedPrefix + command}* ${teks}\n`
        }

        if (!conn.public && !m.key.fromMe && !global.ownernumber.includes(m.sender.split('@')[0])) return

        
        if (m.isGroup && global.db.data.chats?.[m.chat]?.mute && !isCreator && !isGroupAdmins) return

        
        if (m.isGroup && global.db.data.chats?.[m.chat]?.banchat && !isCreator) return

        printMessage(m, groupName, participants)

        const ownerFromDB = global.db?.data?.owner || []
        const ownerFromSettings = Array.isArray(global.ownernumber)
            ? global.ownernumber
            : [global.ownernumber].filter(Boolean)

        global.ownerlist = [...new Set([...ownerFromDB, ...ownerFromSettings])]

        async function sendconnMessage(chatId, message, options = {}) {
            let generate = await generateWAMessage(chatId, message, options)
            let type2 = getContentType(generate.message)
            if ('contextInfo' in options) generate.message[type2].contextInfo = options?.contextInfo
            if ('contextInfo' in message) generate.message[type2].contextInfo = message?.contextInfo
            return await conn.relayMessage(chatId, generate.message, { messageId: generate.key.id })
        }

        function GetType(Data) {
            return new Promise((resolve, reject) => {
                let Result, Status
                if (Buffer.isBuffer(Data)) {
                    Result = new Buffer.from(Data).toString('base64')
                    Status = 0
                } else {
                    Status = 1
                }
                resolve({ status: Status, result: Result })
            })
        }

        function randomId() {
            return Math.floor(100000 + Math.random() * 900000)
        }

        function monospace(string) {
            return '```' + string + '```'
        }

        function monospa(string) {
            return '`' + string + '`'
        }

        function getRandomFile(ext) {
            return `${Math.floor(Math.random() * 10000)}${ext}`
        }

        function pickRandom(list) {
            return list[Math.floor(Math.random() * list.length)]
        }

        function randomNomor(min, max = null) {
            if (max !== null) {
                min = Math.ceil(min)
                max = Math.floor(max)
                return Math.floor(Math.random() * (max - min + 1)) + min
            } else {
                return Math.floor(Math.random() * min) + 1
            }
        }

        function generateRandomPassword() {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#%^&*'
            const length = 10
            let password = ''
            for (let i = 0; i < length; i++) {
                const randomIndex = Math.floor(Math.random() * characters.length)
                password += characters[randomIndex]
            }
            return password
        }

        function generateRandomNumber(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min
        }

        async function dellCase(filePath, caseNameToRemove) {
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) { console.error('Terjadi kesalahan:', err); return }
                const regex = new RegExp(`case\\s+'${caseNameToRemove}':[\\s\\S]*?break`, 'g')
                const modifiedData = data.replace(regex, '')
                fs.writeFile(filePath, modifiedData, 'utf8', (err) => {
                    if (err) { console.error('Terjadi kesalahan saat menulis file:', err); return }
                    console.log(`Teks dari case '${caseNameToRemove}' telah dihapus dari file.`)
                })
            })
        }

        const { plugins, beforeHooks, allHooks } = await pluginsLoader(path.resolve(__dirname, 'plugins'))

        const schnee = {
            conn, usedPrefix, command, reply, text, isGroup: m.isGroup,
            isCreator, example, sender, senderNumber, pushname, args, runtime,
            formatp, sleep, getBuffer, isBotAdmins, isAdmins, isCmd, qtext,
            isPremium, randomNomor, monospace, pickRandom, getRandomFile,
            groupMetadata, participants, groupAdmins, groupName, groupOwner,
            isOwner: isCreator, isAdmin: isGroupAdmins, isBotAdmin: isBotAdmins,
        }

        for (const { fn, ctx } of allHooks) {
            try { await fn.call(ctx || conn, m, schnee) } catch (e) { console.log('[all hook]', e.message) }
        }

        for (const { fn, ctx } of beforeHooks) {
            try {
                const result = await fn.call(ctx || conn, m, schnee)
                if (result === false) return
            } catch (e) { console.log('[before hook]', e.message) }
        }

        let pluginsDisable = true
        for (const plugin of plugins) {
            if (typeof plugin !== 'function') continue
            if (!matchCommand(plugin, command)) continue
            pluginsDisable = false

            if (plugin.owner && !isCreator)
                return reply(global.mess.creator || '[ !! ] *sʏsᴛᴇᴍ*\nFeature ini khusus Owner')
            if (plugin.admin && !isAdmins)
                return reply(global.mess.admin || '[ !! ] *sʏsᴛᴇᴍ*\nKhusus Admin Grup')
            if (plugin.botAdmin && !isBotAdmins)
                return reply(global.mess.botAdmin || '[ !! ] *sʏsᴛᴇᴍ*\nBot belum jadi Admin')
            if (plugin.group && !m.isGroup)
                return reply(global.mess.group || '[ !! ] *sʏsᴛᴇᴍ*\nKhusus di dalam Grup')
            if (plugin.private && m.isGroup)
                return reply(global.mess.private || '[ !! ] *sʏsᴛᴇᴍ*\nKhusus Private Chat')
            if (plugin.premium && !isPremium && !isCreator)
                return reply(global.mess.premium || '[ !! ] *sʏsᴛᴇᴍ*\nKhusus Premium')

            await plugin(m, schnee)
        }
        if (!pluginsDisable) return

        switch (command) {
case 'k-menu':
case 'help':
case 'menu': {
 await conn.sendMessage(m.chat, { react: { text: '🦄', key: m.key } })

 const teks = `🌌 Aku adalah sistem otomatis (Bot WhatsApp), yang dirancang oleh *${global.ownername}* untuk mencari dan mengambil data melalui Aplikasi WhatsApp.
 
┏──☉『 ɪɴғᴏ ʙᴏᴛ 』
┃ *ɴᴀᴍᴀ ʙᴏᴛ :* ${global.namabot}
┃ *ʀᴜɴᴛɪᴍᴇ :* ${runtime(process.uptime())}
┃ *ᴠᴇʀsɪᴏɴ :* ${global.version}
┃ *ᴀᴜᴛʜᴏʀ :* ${global.ownername}
┗───────────☉

*L I S T – M E N U*
*👑 Owner*
 —✧ ${prefix}case add/del/get/list
 —✧ ${prefix}plugin add/del/get/list
 —✧ ${prefix}scrape add/del/get/list
 —✧ ${prefix}backup
 —✧ ${prefix}addprem
 —✧ ${prefix}delprem
 —✧ ${prefix}listprem
 —✧ ${prefix}enable / disable
 —✧ ${prefix}banchat <on/off>

*⚡ Advanced*
 —✧ =>
 —✧ >
 —✧ $

*🤖 AI*
 —✧ ${prefix}ai / openai <query>
 —✧ ${prefix}aiimage <prompt>

*⬇️ Downloader*
 —✧ ${prefix}play <query>
 —✧ ${prefix}ytmp3 <url>
 —✧ ${prefix}ytmp4 <url>

*👥 Group*
 —✧ ${prefix}mute <on/off>
 —✧ ${prefix}add <@user>
 —✧ ${prefix}kick <@user>
 —✧ ${prefix}promote <@user>
 —✧ ${prefix}demote <@user>
 —✧ ${prefix}opengc
 —✧ ${prefix}closegc

*🔧 Tools*
 —✧ ${prefix}tourl <nomor>
`

 const fetchImageBuffer = async (url) => {
 const res = await axios.get(url, { responseType: 'arraybuffer' })
 return Buffer.from(res.data)
 }

 const thumbnail = await fetchImageBuffer('https://files.catbox.moe/0rgeid.jpg')

 await conn.sendMessage(m.chat, {
 document: thumbnail,
 mimetype: "image/jpeg",
 fileName: "– Miracle Midnight",
 jpegThumbnail: thumbnail,
 caption: teks.trim(),
 footer: `© ${global.namabot} - ${global.foother}`,
 contextInfo: {
 mentionedJid: [m.sender],
 forwardingScore: 999,
 isForwarded: true,

 forwardedNewsletterMessageInfo: {
 newsletterJid: '-',
 newsletterName: global.ownername,
 serverMessageId: 143
 },

 businessMessageForwardInfo: {
 businessOwnerJid: conn.decodeJid(conn.user.id)
 },

 externalAdReply: {
 title: global.namabot,
 body: global.foother,
 thumbnailUrl: 'https://cdn.nekohime.site/file/I_TmrVAC.jpeg',
 sourceUrl: '',
 mediaType: 1,
 renderLargerThumbnail: true
 }
 }
 }, { quoted: m })
}
break

            case 'ai':
            case 'gpt':
            case 'chatgpt':
            case 'openai': {
                if (!q) return m.reply('❗ *Contoh:* .ai Apa itu JavaScript?')
                let loadingMsg = await m.reply('🤖 AI sedang memproses pertanyaanmu...')
                try {
                    const lenai = await Ai4Chat(q)
                    let reaction = '✨'
                    if (lenai.toLowerCase().includes('ya') || lenai.toLowerCase().includes('benar')) reaction = '👍'
                    else if (lenai.toLowerCase().includes('tidak') || lenai.toLowerCase().includes('salah')) reaction = '❌'
                    else if (lenai.length > 200) reaction = '🤯'
                    const response =
                        `💡 Pertanyaan: 
${text}

📝 Jawaban: 
${lenai}

⏰ Waktu: ${new Date().toLocaleTimeString()}
💠 Powered by ${namabot} ${reaction}`
                    await conn.sendMessage(m.chat, { text: response }, { edit: loadingMsg.key })
                } catch (error) {
                    console.error('ERROR:', error)
                    await conn.sendMessage(m.chat, { text: '⚠️ Terjadi kesalahan saat memproses jawaban AI.' }, { edit: loadingMsg.key })
                }
            }
            break

            case 'runtime': {
                let lowq = `*Telah Online Selama:*\n${runtime(process.uptime())}*`
                m.reply(`${lowq}`)
            }
            break

case 'case': {
    if (!isCreator) return m.reply('❗ Owner Only')

    if (!text) return m.reply(`Contoh:
.case add case "help": {
reply('ok')
}
break

.case get help
.case del help
.case list`)

    const [action, ...args] = text.split(' ')
    const namaFile = './command/case.js'

    if (!fs.existsSync(namaFile))
        return m.reply('File case.js tidak ditemukan')

    let content = fs.readFileSync(namaFile, 'utf-8')

    
    
    
    function getCaseBlock(name) {
        const lines = content.split('\n')
        let startIndex = -1
        let endIndex = -1

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].match(new RegExp(`case ['"\`]${name}['"\`]`, 'i'))) {

                
                let j = i
                while (j >= 0 && lines[j].trim().startsWith('case ')) {
                    startIndex = j
                    j--
                }

                
                for (let k = i; k < lines.length; k++) {
                    if (lines[k].includes('break')) {
                        endIndex = k
                        break
                    }
                }
                break
            }
        }

        if (startIndex === -1 || endIndex === -1) return null

        return {
            start: startIndex,
            end: endIndex,
            block: lines.slice(startIndex, endIndex + 1).join('\n')
        }
    }

    
    
    
    if (action === 'add') {

        const caseBaru = text.slice(4).trim()
        if (!caseBaru) return m.reply('Masukkan isi case baru')

        const namaMatch = caseBaru.match(/case\s+['"`](.*?)['"`]/i)
        if (!namaMatch) return m.reply('Format case tidak valid')

        const caseName = namaMatch[1]

        const existing = getCaseBlock(caseName)

        if (existing) {

            const lines = content.split('\n')

            lines.splice(
                existing.start,
                existing.end - existing.start + 1,
                caseBaru
            )

            fs.writeFileSync(namaFile, lines.join('\n'))

            return m.reply(`✅ Case '${caseName}' berhasil diganti`)
        }

        const posisiDefault = content.lastIndexOf('default:')
        if (posisiDefault === -1)
            return m.reply('default: tidak ditemukan')

        const hasil =
            content.slice(0, posisiDefault) +
            '\n\n' + caseBaru + '\n\n' +
            content.slice(posisiDefault)

        fs.writeFileSync(namaFile, hasil)

        return m.reply(`✅ Case '${caseName}' berhasil ditambahkan`)
    }

    if (action === 'get') {

        const name = args[0]
        if (!name) return m.reply('Contoh: .case get help')

        const result = getCaseBlock(name)
        if (!result) return m.reply('❌ Case tidak ditemukan')

        return m.reply(result.block)
    }

    if (action === 'del') {

        const name = args[0]
        if (!name) return m.reply('Contoh: .case del help')

        const result = getCaseBlock(name)
        if (!result) return m.reply('❌ Case tidak ditemukan')

        const lines = content.split('\n')
        lines.splice(result.start, result.end - result.start + 1)

        fs.writeFileSync(namaFile, lines.join('\n'))

        return m.reply(`✅ Case '${name}' berhasil dihapus`)
    }

    if (action === 'list') {

        const regex = /case\s+['"`](.*?)['"`]/g
        let match
        let list = []

        while ((match = regex.exec(content)) !== null) {
            list.push(match[1])
        }

        if (!list.length) return m.reply('Tidak ada case ditemukan')

        let teks = '📂 LIST CASE:\n\n'
        list.forEach((v, i) => {
            teks += `${i + 1}. ${v}\n`
        })

        return m.reply(teks)
    }

    m.reply('Action tidak dikenal')
}
break

            case 'addpremium': case 'addprem': {
                if (!isCreator) return
                if (!q) return m.reply(
`❓ *Cara pakai:*
.addpremium @user 1d
.addpremium 628xxx 7d
.addpremium @user 1m
.addpremium @user 1y

*Satuan waktu:*
› h = jam
› d = hari
› w = minggu
› m = bulan
› y = tahun`
                )

                const parseDuration = (str) => {
                    const match = str.match(/^(\d+)([hdwmy])$/)
                    if (!match) return null
                    const num = parseInt(match[1])
                    const unit = match[2]
                    const ms = { h: 3600000, d: 86400000, w: 604800000, m: 2592000000, y: 31536000000 }
                    return num * ms[unit]
                }

                const parts = q.trim().split(' ')
                const durationStr = parts.find(p => /^\d+[hdwmy]$/i.test(p.trim())) || ''
                
                const rawTarget = mentionByTag[0]
                    || (m.quoted ? m.quoted.sender : null)
                    || (parts.find(p => !p.includes('@') && /^\d{5,}$/.test(p.replace(/[^0-9]/g, '')) && !/^\d+[hdwmy]$/i.test(p))?.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
                    || null

                if (!durationStr) return m.reply('❌ Masukkan durasi. Contoh: 1d, 7d, 1m')
                const duration = parseDuration(durationStr.toLowerCase())
                if (!duration) return m.reply('❌ Format durasi tidak valid. Gunakan: 1h, 1d, 1w, 1m, 1y')

                const target = rawTarget.includes('@') ? rawTarget : rawTarget + '@s.whatsapp.net'
                const expiredAt = Date.now() + duration

                if (!global.db.data.users[target]) global.db.data.users[target] = {}
                global.db.data.users[target].premium = true
                global.db.data.users[target].premiumTime = expiredAt

                if (!global.db.data.premium.includes(target)) global.db.data.premium.push(target)

                await global.db.write()

                const durationLabel = { h: 'jam', d: 'hari', w: 'minggu', m: 'bulan', y: 'tahun' }
                const match = durationStr.match(/^(\d+)([hdwmy])$/)
                const readableTime = `${match[1]} ${durationLabel[match[2]]}`
                const expDate = new Date(expiredAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })

                m.reply(
`✅ *Premium Berhasil Ditambahkan!*

👤 User: @${target.split('@')[0]}
⏳ Durasi: ${readableTime}
📅 Expired: ${expDate}`
                )
            }
            break

            case 'delpremium': case 'delprem': {
                if (!isCreator) return
                if (!q && !mentionByTag[0]) return m.reply('❌ Masukkan @user atau nomor')

                const target = mentionByTag[0]
                    || (m.quoted ? m.quoted.sender : null)
                    || (q.replace(/[^0-9]/g, '') + '@s.whatsapp.net')

                const idx = global.db.data.premium.indexOf(target)
                if (idx === -1) return m.reply('❌ User tidak terdaftar sebagai premium')

                global.db.data.premium.splice(idx, 1)
                if (global.db.data.users[target]) {
                    global.db.data.users[target].premium = false
                    global.db.data.users[target].premiumTime = 0
                }

                await global.db.write()
                m.reply(`✅ Premium @${target.split('@')[0]} berhasil dihapus`)
            }
            break

            case 'listprem': case 'listpremium': {
                if (!isCreator) return m.reply('❗ *Access Denied*\nFitur Only `Owner`')
                const premList = global.db.data.premium || []
                if (!premList.length) return m.reply('⚠️ Tidak ada Premium yang terdaftar!')

                let teks = '💎 *Daftar Premium:*\n\n'
                premList.forEach((jid, i) => {
                    const userData = global.db.data.users[jid]
                    const expiredAt = userData?.premiumTime
                    const expStr = expiredAt
                        ? new Date(expiredAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
                        : 'Tidak diketahui'
                    teks += `${i + 1}. @${jid.split('@')[0]}
    └ Expired: ${expStr}
`
                })

                conn.sendMessage(m.chat, {
                    text: teks,
                    mentions: premList
                }, { quoted: m })
            }
            break

            default: {
                if (budy.startsWith('=>')) {
                    if (!isCreator) return
                    try {
                        let result = await eval(`(async () => { return ${budy.slice(3)} })()`)
                        if (result === undefined) {
                            return m.reply(`📨 ID: ${m.id}`)
                        }
                        if (result instanceof Promise) result = await result
                        const output = typeof result === 'string' ? result : util.inspect(result, { depth: 4 })
                        m.reply(output)
                    } catch (e) {
                        m.reply(`❌ Error:\n${String(e)}`)
                    }
                }

                if (budy.startsWith('>') && !budy.startsWith('=>')) {
                    if (!isCreator) return
                    try {
                        let evaled = await eval(`(async () => { ${budy.slice(2)} })()`)
                        if (evaled === undefined) {
                            return m.reply(`📨 ID: ${m.id}`)
                        }
                        if (evaled instanceof Promise) evaled = await evaled
                        const output = typeof evaled === 'string' ? evaled : util.inspect(evaled, { depth: 4 })
                        await m.reply(output)
                    } catch (err) {
                        m.reply(`❌ Error:\n${String(err)}`)
                    }
                }

                if (budy.startsWith('$')) {
                    if (!isCreator) return
                    const { execSync } = require('child_process')
                    try {
                        const stdout = execSync(budy.slice(2), { encoding: 'utf-8', timeout: 10000 })
                        m.reply(stdout.trim() || `📨 ID: ${m.id}`)
                    } catch (err) {
                        m.reply(`❌ Error:\n${err.stderr || err.message}`)
                    }
                }
            }
        }
    } catch (err) {
        console.log(util.format(err))
    }
}

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update ${__filename}`))
    delete require.cache[file]
    require(file)
})
