const {
    downloadContentFromMessage,
    generateForwardMessageContent,
    generateWAMessageFromContent,
    jidDecode,
} = require('baileys')
const { modul } = require('#modul')
const { fs, axios, FileType, PhoneNumber } = modul
const { getBuffer, getSizeMedia } = require('./myfunc')

function attachToConn(conn, store) {

    // ── sendMessage override: embedMusic annotation ──────────────────────
    const _orig = conn.sendMessage.bind(conn)
    conn.sendMessage = (jid, content, options = {}) =>
        _orig(jid, {
            ...content,
            annotations: content.annotations || [{
                embeddedContent: {
                    embeddedMusic: {
                        musicContentMediaId: 12,
                        songId: 11,
                        author: global.ownername || '',
                        title:  global.namabot   || '',
                        artistAttribution: 'https://github.com/IkyyKzy',
                    },
                },
                embeddedAction: true,
            }],
            mentions: content.mentions || conn.parseMention(content?.text || content?.caption || ''),
        }, { useCachedGroupMetadata: true, ...options })

    // ── decodeJid ────────────────────────────────────────────────────────
    conn.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            const decode = jidDecode(jid) || {}
            return (decode.user && decode.server && decode.user + '@' + decode.server) || jid
        }
        return jid
    }

    // ── getName ──────────────────────────────────────────────────────────
    conn.getName = (jid, withoutContact = false) => {
        const id = conn.decodeJid(jid)
        withoutContact = conn.withoutContact || withoutContact
        let v
        if (id.endsWith('@g.us'))
            return new Promise(async (resolve) => {
                v = store.contacts[id] || {}
                if (!(v.name || v.subject)) v = await conn.groupMetadata(id).catch(() => ({})) || {}
                resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@g.us', '')).getNumber('international'))
            })
        v = id === '0@s.whatsapp.net'
            ? { id, name: 'WhatsApp' }
            : id === conn.decodeJid(conn.user.id)
                ? conn.user
                : store.contacts[id] || {}
        return (withoutContact ? '' : v.name) || v.subject || v.verifiedName ||
            PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }

    // ── parseMention ─────────────────────────────────────────────────────
    conn.parseMention = (text = '') =>
        [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')

    // ── sendTextWithMentions ─────────────────────────────────────────────
    conn.sendTextWithMentions = async (jid, text, quoted, options = {}) =>
        conn.sendMessage(jid, {
            text,
            contextInfo: { mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net') },
            ...options,
        }, { quoted })

    // ── sendContact ──────────────────────────────────────────────────────
    conn.sendContact = async (jid, numbers, quoted = '', opts = {}) => {
        const list = []
        for (const num of numbers) {
            const name = await conn.getName(num)
            list.push({
                displayName: name,
                vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nitem1.TEL;waid=${num}:${num}\nitem1.X-ABLabel:Click here to chat\nEND:VCARD`,
            })
        }
        return conn.sendMessage(jid, { contacts: { displayName: `${list.length} Contact`, contacts: list }, ...opts }, { quoted })
    }

    // ── setStatus ────────────────────────────────────────────────────────
    conn.setStatus = (status) => {
        conn.query({
            tag: 'iq',
            attrs: { to: '@s.whatsapp.net', type: 'set', xmlns: 'status' },
            content: [{ tag: 'status', attrs: {}, content: Buffer.from(status, 'utf-8') }],
        })
        return status
    }

    // ── sendText ─────────────────────────────────────────────────────────
    conn.sendText = (jid, text, quoted = '', options = {}) =>
        conn.sendMessage(jid, { text, ...options }, { quoted })

    // ── copyNForward ─────────────────────────────────────────────────────
    conn.copyNForward = async (jid, message, forceForward = false, options = {}) => {
        let mtype = Object.keys(message.message)[0]
        if (options.readViewOnce && message.message?.ephemeralMessage) {
            message.message = message.message.ephemeralMessage.message
            mtype = Object.keys(message.message.viewOnceMessage?.message || {})[0]
            if (mtype) delete message.message.viewOnceMessage.message[mtype].viewOnce
            message.message = { ...message.message.viewOnceMessage?.message }
        }
        const content = await generateForwardMessageContent(message, forceForward)
        const ctype = Object.keys(content)[0]
        const context = mtype !== 'conversation' ? message.message[mtype]?.contextInfo || {} : {}
        content[ctype].contextInfo = { ...context, ...content[ctype].contextInfo }
        const waMessage = await generateWAMessageFromContent(jid, content, options
            ? { ...content[ctype], ...options, ...(options.contextInfo ? { contextInfo: { ...content[ctype].contextInfo, ...options.contextInfo } } : {}) }
            : {}
        )
        await conn.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id })
        return waMessage
    }

    // ── downloadMediaMessage ─────────────────────────────────────────────
    conn.downloadMediaMessage = async (message) => {
        const mime = (message.msg || message).mimetype || ''
        const messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(message.msg || message, messageType)
        let buffer = Buffer.from([])
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
        return buffer
    }

    // ── downloadAndSaveMediaMessage ──────────────────────────────────────
    conn.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        const buffer = await conn.downloadMediaMessage(message)
        const type = await FileType.fromBuffer(buffer)
        const ext = (type?.ext === 'ogg' || type?.ext === 'opus') ? 'mp3' : (type?.ext || 'bin')
        const trueFileName = attachExtension ? `${filename}.${ext}` : filename
        fs.writeFileSync(trueFileName, buffer)
        return trueFileName
    }

    // ── getFile ──────────────────────────────────────────────────────────
    conn.getFile = async (PATH, save) => {
        let filename
        const data = Buffer.isBuffer(PATH) ? PATH
            : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`\``[1], 'base64')
            : /^https?:\/\//.test(PATH) ? await getBuffer(PATH)
            : fs.existsSync(PATH) ? ((filename = PATH), fs.readFileSync(PATH))
            : typeof PATH === 'string' ? PATH
            : Buffer.alloc(0)
        const type = (await FileType.fromBuffer(data)) || { mime: 'application/octet-stream', ext: '.bin' }
        if (data && save && filename) await fs.promises.writeFile(filename, data)
        return { filename, size: await getSizeMedia(data), ...type, data }
    }

    // ── sendFile ─────────────────────────────────────────────────────────
    conn.sendFile = async (jid, media, options = {}) => {
        const file = await conn.getFile(media)
        const extMap = { mp3: 'audio', jpg: 'image', jpeg: 'image', png: 'image', webp: 'sticker', mp4: 'video' }
        const type = extMap[file.ext] || 'document'
        if (type === 'audio') { options.mimetype = 'audio/mpeg'; options.ptt = options.ptt || false }
        return conn.sendMessage(jid, { [type]: file.data, caption: options.caption || '', ...options }, { quoted: options.quoted || '' })
    }

    // ── sendFileUrl ──────────────────────────────────────────────────────
    conn.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
        const res = await axios.head(url)
        const mime = res.headers['content-type']
        const buf = await getBuffer(url)
        if (mime.includes('gif'))        return conn.sendMessage(jid, { video: buf, caption, gifPlayback: true, ...options }, { quoted })
        if (mime.includes('pdf'))        return conn.sendMessage(jid, { document: buf, mimetype: 'application/pdf', caption, ...options }, { quoted })
        if (mime.startsWith('image'))    return conn.sendMessage(jid, { image: buf, caption, ...options }, { quoted })
        if (mime.startsWith('video'))    return conn.sendMessage(jid, { video: buf, caption, mimetype: 'video/mp4', ...options }, { quoted })
        if (mime.startsWith('audio'))    return conn.sendMessage(jid, { audio: buf, caption, mimetype: 'audio/mpeg', ...options }, { quoted })
    }

    // ── sendImage ────────────────────────────────────────────────────────
    conn.sendImage = async (jid, path, caption = '', quoted = '', options = {}) => {
        const buffer = Buffer.isBuffer(path) ? path
            : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`\``[1], 'base64')
            : /^https?:\/\//.test(path) ? await getBuffer(path)
            : fs.existsSync(path) ? fs.readFileSync(path)
            : Buffer.alloc(0)
        return conn.sendMessage(jid, { image: buffer, caption, ...options }, { quoted })
    }

    // ── serializeM ───────────────────────────────────────────────────────
    conn.serializeM = (m) => {
        const { smsg } = require('./myfunc')
        return smsg(conn, m, store)
    }
}

module.exports = { attachToConn }

let file = require.resolve(__filename)
const { fs: _fs } = require('#modul').modul
const _chalk = { redBright: (s) => `\x1b[91m${s}\x1b[0m` }
_fs.watchFile(file, () => {
    _fs.unwatchFile(file)
    console.log(_chalk.redBright(`Update ${__filename}`))
    delete require.cache[file]
    require(file)
})
