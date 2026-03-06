const { modul } = require('../../../module')
const { fs, path } = modul

const baseDir = path.join(__dirname, '../../plugins')

const handler = async (m, { conn, text }) => {
    if (!text) {
        return m.reply(
`📦 *Plugin Manager*

Contoh:
› .plugin add owner/menu.js  ← reply file .js atau teks
› .plugin add tools/cmd.mjs  ← support ESM .mjs
› .plugin get owner/menu.js
› .plugin del owner/menu.js
› .plugin list
› .plugin list downloader`
        )
    }

    const spaceIdx = text.indexOf(' ')
    const action   = spaceIdx !== -1 ? text.slice(0, spaceIdx).toLowerCase() : text.toLowerCase()
    const filePath  = spaceIdx !== -1 ? text.slice(spaceIdx + 1).trim() : ''
    const fullPath  = filePath ? path.resolve(baseDir, filePath) : null

    if (filePath && fullPath && !fullPath.startsWith(baseDir))
        return m.reply('❌ Path tidak valid')

    if (action === 'add') {
        if (!filePath) return m.reply('❌ Masukkan path file\nContoh: .plugin add folder/nama.js')
        if (!filePath.endsWith('.js') && !filePath.endsWith('.mjs'))
            return m.reply('❌ File harus berekstensi .js atau .mjs')
        if (!m.quoted) return m.reply('❌ Reply file atau teks kode yang ingin disimpan')

        let code = ''
        if (
            m.quoted.mimetype?.includes('javascript') ||
            m.quoted.fileName?.endsWith('.js') ||
            m.quoted.fileName?.endsWith('.mjs')
        ) {
            const buffer = await m.quoted.download()
            code = buffer.toString()
        } else {
            code = m.quoted.text || ''
        }

        if (!code.trim()) return m.reply('❌ Code kosong')
        fs.mkdirSync(path.dirname(fullPath), { recursive: true })
        fs.writeFileSync(fullPath, code, 'utf-8')
        return m.reply(`✅ Plugin berhasil disimpan!\n📁 ${filePath}`)
    }

    if (action === 'get') {
        if (!filePath) return m.reply('❌ Masukkan path file')
        const variants = [fullPath, fullPath.replace(/\.js$/, '.mjs'), fullPath.replace(/\.mjs$/, '.js')]
        const found = variants.find(p => p && fs.existsSync(p))
        if (!found) return m.reply(`❌ File tidak ditemukan:\n${filePath}`)
        const data = fs.readFileSync(found, 'utf-8')
        return conn.sendMessage(m.chat, {
            document: Buffer.from(data),
            mimetype: 'application/javascript',
            fileName: path.basename(found)
        }, { quoted: m })
    }

    if (action === 'del') {
        if (!filePath) return m.reply('❌ Masukkan path file')
        const variants = [fullPath, fullPath.replace(/\.js$/, '.mjs'), fullPath.replace(/\.mjs$/, '.js')]
        const found = variants.find(p => p && fs.existsSync(p))
        if (!found) return m.reply(`❌ File tidak ditemukan:\n${filePath}`)
        fs.unlinkSync(found)
        return m.reply(`✅ Plugin berhasil dihapus!\n📁 ${filePath}`)
    }

    if (action === 'list') {
        const targetDir = filePath ? path.resolve(baseDir, filePath) : baseDir
        if (!targetDir.startsWith(baseDir)) return m.reply('❌ Path tidak valid')
        if (!fs.existsSync(targetDir)) return m.reply(`❌ Folder tidak ditemukan:\n${filePath || 'plugins'}`)

        function readDirRec(dir, pre = '') {
            let results = []
            for (const item of fs.readdirSync(dir)) {
                const full = path.join(dir, item)
                if (fs.statSync(full).isDirectory()) {
                    results = results.concat(readDirRec(full, path.join(pre, item)))
                } else if (item.endsWith('.js') || item.endsWith('.mjs')) {
                    results.push(path.join(pre, item))
                }
            }
            return results
        }

        const files = readDirRec(targetDir)
        if (!files.length) return m.reply('📭 Tidak ada plugin')
        let teks = `📂 *LIST PLUGIN* ${filePath ? `(${filePath})` : ''}\n\n`
        files.forEach((v, i) => { teks += `${i + 1}. ${v}\n` })
        return m.reply(teks.trim())
    }

    return m.reply(`❓ Action tidak dikenal: *${action}*\nGunakan: add | get | del | list`)
}

handler.help  = ['plugin add/get/del/list']
handler.tags  = ['owner']
handler.command = ['plugin', 'p']
handler.owner = true

module.exports = handler
