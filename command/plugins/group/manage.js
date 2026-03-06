const handler = async (m, { conn, text, command, groupMetadata, participants }) => {

    const getFullJid = (jid) => {
        if (!jid) return null
        if (!jid.endsWith('@lid')) return jid
        const found = participants.find(p => p.lid === jid || p.id === jid)
        return found?.jid || jid
    }

    const rawTarget = m.quoted
        ? m.quoted.sender
        : m.mentionedJid?.[0] || null

    const target = rawTarget
        ? getFullJid(rawTarget)
        : text
        ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
        : null

    const needTarget = ['add', 'kick', 'promote', 'demote']
    if (needTarget.includes(command) && !target)
        return m.reply('Reply/tag siapa yang ingin di proses.')

    // cek keberadaan di grup berdasarkan jid
    const inGc = target && participants.some(p =>
        p.jid === target || p.id === target || p.lid === target || p.phoneNumber === target
    )

    switch (command) {
        case 'add': {
            if (inGc) return m.reply('User sudah ada didalam grup!')
            const response = await conn.groupParticipantsUpdate(m.chat, [target], 'add')
            const jpegThumbnail = await conn.profilePictureUrl(m.chat, 'image', 'buffer').catch(() => null)

            for (const participant of response) {
                const jid = participant?.content?.attrs?.phone_number
                    || participant?.content?.attrs?.jid
                    || target
                const status = participant?.status

                if (status === '408') {
                    m.reply(`Tidak dapat menambahkan @${jid.split('@')[0]}!\nMungkin baru keluar atau dikick.`, null, { mentions: [jid] })
                } else if (status === '403') {
                    const inviteCode = participant?.content?.content?.[0]?.attrs?.code
                    const inviteExp  = participant?.content?.content?.[0]?.attrs?.expiration
                    await m.reply(`Mengundang @${jid.split('@')[0]} menggunakan invite...`, null, { mentions: [jid] })
                    if (inviteCode) {
                        await conn.sendGroupV4Invite(
                            m.chat, jid, inviteCode, inviteExp,
                            groupMetadata.subject,
                            'Undangan untuk bergabung ke grup WhatsApp saya',
                            jpegThumbnail
                        )
                    }
                } else {
                    m.reply(`Berhasil menambahkan @${jid.split('@')[0]}`, null, { mentions: [jid] })
                }
            }
            break
        }

        case 'kick':
            if (!inGc) return m.reply('User tidak ada dalam grup.')
            await conn.groupParticipantsUpdate(m.chat, [target], 'remove')
            m.reply(`Berhasil kick: @${target.split('@')[0]}`, null, { mentions: [target] })
            break

        case 'promote':
            if (!inGc) return m.reply('User tidak berada dalam grup!')
            await conn.groupParticipantsUpdate(m.chat, [target], 'promote')
            m.reply(`Berhasil promote: @${target.split('@')[0]}`, null, { mentions: [target] })
            break

        case 'demote':
            if (!inGc) return m.reply('User tidak berada dalam grup!')
            await conn.groupParticipantsUpdate(m.chat, [target], 'demote')
            m.reply(`Berhasil demote: @${target.split('@')[0]}`, null, { mentions: [target] })
            break

        case 'closegc':
            await conn.groupSettingUpdate(m.chat, 'announcement')
            m.reply('Grup berhasil ditutup (hanya admin yang bisa chat).')
            break

        case 'opengc':
            await conn.groupSettingUpdate(m.chat, 'not_announcement')
            m.reply('Grup berhasil dibuka (semua member bisa chat).')
            break
    }
}

handler.help     = ['add', 'kick', 'promote', 'demote', 'opengc', 'closegc']
handler.tags     = ['group']
handler.command  = ['add', 'kick', 'promote', 'demote', 'mute', 'unmute']
handler.group    = true
handler.admin    = true
handler.botAdmin = true

module.exports = handler