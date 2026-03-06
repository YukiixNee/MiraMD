const handler = async (m, { conn, args }) => {
    const chat = m.chat
    const sub = (args[0] || '').toLowerCase()

    if (!sub || !['on', 'off'].includes(sub))
        return m.reply('Penggunaan: .mute on / .mute off')

    if (!global.db.data.chats[chat]) global.db.data.chats[chat] = { mute: false, banchat: false }

    const muting = sub === 'on'

    // Konflik: mute on → matikan banchat
    if (muting && global.db.data.chats[chat].banchat) {
        global.db.data.chats[chat].banchat = false
        global.db.data.chats[chat].mute = true
        await global.db.write()
        return m.reply(
`🔇 *Mute aktif!*
Bot tidak akan merespons pesan non-admin di grup ini.

⚠️ *Banchat otomatis dimatikan karena konflik.`
        )
    }

    global.db.data.chats[chat].mute = muting
    await global.db.write()

    m.reply(muting
        ? '🔇 *Mute aktif!*\nBot tidak akan merespons pesan non-admin di grup ini.'
        : '🔊 *Mute dinonaktifkan!*\nBot kembali aktif di grup ini.'
    )
}

handler.help    = ['mute on/off']
handler.tags    = ['group']
handler.command = ['mute']
handler.group   = true
handler.admin   = true   // admin grup bisa toggle mute

module.exports = handler
