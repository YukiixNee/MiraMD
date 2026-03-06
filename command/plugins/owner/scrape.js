const { modul } = require('../../../module')
const { fs, path, chalk } = modul

const baseDir = path.join(__dirname, '../../../src/scrape')

let handler = async (m, { conn, text }) => {
    if (!text) {
        return m.reply(
`🔧 *Scrape Manager*

Contoh:
› .scrape add NamaScrape.js ← reply file/code .js
› .scrape get NamaScrape.js
› .scrape del NamaScrape.js
› .scrape list`
        )
    }

    const spaceIdx = text.indexOf(' ')
    const action   = spaceIdx !== -1 ? text.slice(0, spaceIdx).toLowerCase() : text.toLowerCase()
    const filePath  = spaceIdx !== -1 ? text.slice(spaceIdx + 1).trim() : ''
    const fullPath  = filePath ? path.resolve(baseDir, filePath) : null

    if (filePath && fullPath && !fullPath.startsWith(baseDir))
        return m.reply('❌ Path tidak valid')

    // ─── ADD ─────────────────────────────────────────────────────────────────
    if (action === 'add') {
        if (!filePath) return m.reply('❌ Masukkan nama file .js\nContoh: .scrape add NamaScrape.js')
        if (!filePath.endsWith('.js')) return m.reply('❌ File harus berekstensi .js')
        if (!m.quoted) return m.reply('❌ Reply file .js atau teks kode yang ingin disimpan')

        let code = ''
        if (m.quoted.mimetype?.includes('javascript') || m.quoted.fileName?.endsWith('.js')) {
            const buffer = await m.quoted.download()
            code = buffer.toString()
        } else {
            code = m.quoted.text || ''
        }

        if (!code.trim()) return m.reply('❌ Code kosong')

        fs.mkdirSync(path.dirname(fullPath), { recursive: true })
        fs.writeFileSync(fullPath, code, 'utf-8')

        return m.reply(`✅ Scrape berhasil disimpan!\n📁 Path: src/scrape/${filePath}`)
    }

    // ─── GET ─────────────────────────────────────────────────────────────────
    if (action === 'get') {
        if (!filePath) return m.reply('❌ Masukkan nama file .js')
        if (!fs.existsSync(fullPath)) return m.reply(`❌ File tidak ditemukan:\nsrc/scrape/${filePath}`)

        const data = fs.readFileSync(fullPath, 'utf-8')

        return conn.sendMessage(m.chat, {
            document: Buffer.from(data),
            mimetype: 'application/javascript',
            fileName: path.basename(fullPath)
        }, { quoted: m })
    }

    // ─── DEL ─────────────────────────────────────────────────────────────────
    if (action === 'del') {
        if (!filePath) return m.reply('❌ Masukkan nama file .js')
        if (!fs.existsSync(fullPath)) return m.reply(`❌ File tidak ditemukan:\nsrc/scrape/${filePath}`)

        fs.unlinkSync(fullPath)

        return m.reply(`✅ Scrape berhasil dihapus!\n📁 Path: src/scrape/${filePath}`)
    }

    // ─── LIST ─────────────────────────────────────────────────────────────────
    if (action === 'list') {
        if (!fs.existsSync(baseDir))
            return m.reply('❌ Folder src/scrape tidak ditemukan')

        const files = fs.readdirSync(baseDir).filter(f => f.endsWith('.js'))

        if (!files.length) return m.reply('📭 Tidak ada scrape file ditemukan')

        let teks = `📂 *LIST SCRAPE* (src/scrape)\n\n`
        files.forEach((v, i) => { teks += `${i + 1}. ${v}\n` })

        return m.reply(teks.trim())
    }

    return m.reply(`❓ Action tidak dikenal: *${action}*\nGunakan: add | get | del | list`)
}

handler.help    = ['scrape add/get/del/list']
handler.tags    = ['owner']
handler.command = ['scrape']
handler.owner   = true

module.exports = handler