const handler = async (m, { conn, args }) => {
    const chat = m.chat
    const sub = (args[0] || '').toLowerCase()

    if (!sub || !['on', 'off'].includes(sub))
        return m.reply('Penggunaan: .banchat on / .banchat off')

    if (!global.db.data.chats[chat]) global.db.data.chats[chat] = { mute: false, banchat: false }

    const banning = sub === 'on'

    // Konflik: banchat on → matikan mute, banchat off → tidak ada konflik
    if (banning && global.db.data.chats[chat].mute) {
        global.db.data.chats[chat].mute = false
        global.db.data.chats[chat].banchat = true
        await global.db.write()
        return m.reply(
`🚫 *Banchat aktif!*
Hanya owner bot yang bisa menggunakan bot di grup ini.

⚠️ *Mute otomatis dimatikan karena konflik.`
        )
    }

    global.db.data.chats[chat].banchat = banning
    await global.db.write()

    m.reply(banning
        ? '🚫 *Banchat aktif!*\nHanya owner bot yang bisa menggunakan bot di grup ini.'
        : '✅ *Banchat dinonaktifkan!*\nSemua member kembali bisa menggunakan bot.'
    )
}

handler.help    = ['banchat on/off']
handler.tags    = ['group']
handler.command = ['banchat']
handler.group   = true
handler.owner   = true   // khusus owner bot

module.exports = handler
