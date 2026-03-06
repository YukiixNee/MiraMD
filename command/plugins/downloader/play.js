const axios = require("axios")
const yts = require("yt-search")

function safeFileName(text) {
  return (text || "song")
    .replace(/[\\\/:*?"<>|]/g, "")
    .substring(0, 100)
}

let handler = async (m, { conn, args }) => {
  try {
    let query = args.join(" ")
    if (!query) return m.reply("Masukkan judul atau link YouTube")

    await conn.sendMessage(m.chat, {
      react: { text: "⏳", key: m.key }
    })

    if (!/(youtube\.com|youtu\.be)/i.test(query)) {
      const search = await yts(query)
      if (!search.videos.length)
        return m.reply("Lagu tidak ditemukan")
      query = search.videos[0].url
    }

    const api = `https://www.kzy.my.id/api/download/ytdl-mp3?url=${encodeURIComponent(query)}`
    const { data } = await axios.get(api)

    if (!data.status || !data.result?.download)
      throw new Error("Gagal mengambil link download")

    const { title, image, download } = data.result
    const fileName = safeFileName(title) + ".mp3"

    await conn.sendMessage(
      m.chat,
      {
        audio: { url: download },
        mimetype: "audio/mpeg",
        fileName,
        ptt: false,
        contextInfo: {
          externalAdReply: {
            title: title,
            body: "YouTube MP3 Downloader",
            thumbnailUrl: image,
            sourceUrl: query,
            mediaType: 1,
            renderLargerThumbnail: true,
            showAdAttribution: true
          }
        }
      },
      { quoted: m }
    )

    await conn.sendMessage(m.chat, {
      react: { text: "✅", key: m.key }
    })

  } catch (err) {
    console.error(err)
    await conn.sendMessage(m.chat, {
      react: { text: "⚠️", key: m.key }
    })
    m.reply("Terjadi kesalahan:\n" + err.message)
  }
}

handler.command = ['play', 'song'];
handler.tags = ['downloader'];
handler.help = ['play'];
module.exports = handler