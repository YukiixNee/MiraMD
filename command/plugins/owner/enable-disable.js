const FEATURES = {
    public:    'Mode public (semua orang bisa pakai bot)',
    autoread:  'Auto read message',
    anticall:  'Auto reject call (3x = auto block)',
    gconly:    'Hanya respon di grup',
    pconly:    'Hanya respon di private chat',
}

function getSettings(conn) {
    const botJid = conn.user?.jid || conn.user?.id
    if (!global.db.data.settings[botJid]) {
        global.db.data.settings[botJid] = {
            public: true,
            autoread: false,
            anticall: false,
            gconly: false,
            pconly: false,
        }
    }
    return global.db.data.settings[botJid]
}

let handler = async (m, { conn, command, text }) => {
    const settings = getSettings(conn)
    const isEnable = command === 'enable'
    const feat = text?.trim().toLowerCase()

    if (!feat || !FEATURES[feat]) {
        const list = Object.entries(FEATURES).map(([k, v]) => `› .${command} ${k} — ${v}`).join('\n')
        return m.reply(
`📋 *Fitur yang tersedia:*

${list}

*Status sekarang:*
› public   : ${settings.public ? '✅ ON' : '❌ OFF'}
› autoread : ${settings.autoread ? '✅ ON' : '❌ OFF'}
› anticall : ${settings.anticall ? '✅ ON' : '❌ OFF'}
› gconly   : ${settings.gconly ? '✅ ON' : '❌ OFF'}
› pconly   : ${settings.pconly ? '✅ ON' : '❌ OFF'}`
        )
    }

    if (isEnable && settings[feat] === true)
        return m.reply(`⚠️ *${feat}* sudah dalam kondisi ON`)

    if (!isEnable && settings[feat] === false)
        return m.reply(`⚠️ *${feat}* sudah dalam kondisi OFF`)

    settings[feat] = isEnable

    if (isEnable && feat === 'gconly' && settings.pconly) {
        settings.pconly = false
        await global.db.write()
        return m.reply(
`✅ *gconly* berhasil diaktifkan
⚠️ *pconly* otomatis dimatikan karena konflik`
        )
    }

    if (isEnable && feat === 'pconly' && settings.gconly) {
        settings.gconly = false
        await global.db.write()
        return m.reply(
`✅ *pconly* berhasil diaktifkan
⚠️ *gconly* otomatis dimatikan karena konflik`
        )
    }

    await global.db.write()

    const desc = {
        public:   isEnable ? 'Bot sekarang bisa dipakai semua orang' : 'Bot hanya bisa dipakai owner (self mode)',
        autoread : isEnable ? 'Bot akan otomatis membaca semua pesan' : 'Bot tidak auto read pesan',
        anticall : isEnable ? 'Bot akan otomatis menolak panggilan masuk (3x = auto block)' : 'Bot tidak akan menolak panggilan',
        gconly   : isEnable ? 'Bot hanya merespon pesan di grup' : 'Bot merespon di semua chat',
        pconly   : isEnable ? 'Bot hanya merespon pesan di private chat' : 'Bot merespon di semua chat',
    }

    return m.reply(
`${isEnable ? '✅' : '❌'} *${feat}* berhasil di${isEnable ? 'aktifkan' : 'matikan'}

📝 ${desc[feat]}`
    )
}

handler.command = ['enable', 'disable']
handler.tags = ['owner'];
handler.help = ['enable', 'disabled'];
handler.owner = true

module.exports = handler
