const fs = require("fs")
const path = require("path")
const archiver = require("archiver")

// ================= CONFIG =================

const OWNER_JID = "120363403675227900@g.us"

const EXCLUDE = [
  "node_modules",
  "session",
  "sessions",
  "package-lock.json",
  "yarn.lock",
  ".git",
  ".npm",
  ".cache",
  "tmp",
  "temp"
]

// ================= UTIL =================

function shouldIgnore(filePath) {
  return EXCLUDE.some(x => filePath.includes(x))
}

// ================= HANDLER =================

const handler = async (m, { conn }) => {

  await conn.sendMessage(m.chat, {
    react: { text: "⏳", key: m.key }
  })

  try {

    const rootDir = process.cwd()
    const backupName = `backup-${Date.now()}.zip`
    const backupPath = path.join(rootDir, backupName)

    const output = fs.createWriteStream(backupPath)
    const archive = archiver("zip", {
      zlib: { level: 9 }
    })

    archive.pipe(output)

    function walk(dir) {
      const files = fs.readdirSync(dir)

      for (const file of files) {

        const fullPath = path.join(dir, file)
        if (shouldIgnore(fullPath)) continue

        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
          walk(fullPath)
        } else {
          const relative = path.relative(rootDir, fullPath)
          archive.file(fullPath, { name: relative })
        }

      }
    }

    walk(rootDir)

    await archive.finalize()

    output.on("close", async () => {

      const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2)

      await conn.sendMessage(
        OWNER_JID,
        {
          document: fs.readFileSync(backupPath),
          mimetype: "application/zip",
          fileName: backupName,
          caption:
`BOT BACKUP SUCCESS
Size: ${sizeMB} MB
Date: ${new Date().toLocaleString("id-ID")}`
        }
      )

      fs.unlinkSync(backupPath)

      await conn.sendMessage(m.chat, {
        react: { text: "✅", key: m.key }
      })

      m.reply("Backup berhasil dikirim ke owner.")

    })

  } catch (err) {

    console.log("BACKUP ERROR:", err)

    await conn.sendMessage(m.chat, {
      react: { text: "❌", key: m.key }
    })

    m.reply("Backup gagal.")

  }

}

// ================= CONFIG =================

handler.help = ["backup"]
handler.tags = ["owner"]
handler.command = ["backup"]
handler.owner = true

module.exports = handler