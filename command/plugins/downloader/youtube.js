const axios = require("axios")

async function ytdown(url) {
  const { data } = await axios.post(
    "https://app.ytdown.to/proxy.php",
    new URLSearchParams({ url }).toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": "Mozilla/5.0"
      }
    }
  )
  const api = data?.api || {}
  return {
    status: api.status,
    title: api.title,
    mediaItems: api.mediaItems || []
  }
}

const delay = (ms) => new Promise(r => setTimeout(r, ms))

async function resolveFileUrl(mediaUrl, maxRetry = 20, interval = 5000) {
  for (let i = 0; i < maxRetry; i++) {
    try {
      // Delay 5 detik sebelum setiap request
      await delay(interval)

      const { data } = await axios.get(mediaUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json, text/plain, */*",
          "Referer": "https://app.ytdown.to/",
          "Origin": "https://app.ytdown.to"
        }
      })

      if (data?.status === "completed" && data?.fileUrl) {
        return {
          fileUrl:  data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize
        }
      }

      // Status lain (processing, pending, dll) → lanjut retry
      console.log(`[ytdown] retry ${i + 1}/${maxRetry} — status: ${data?.status || "unknown"}`)

    } catch (e) {
      // 400/500 saat masih processing → lanjut retry, jangan langsung throw
      console.log(`[ytdown] retry ${i + 1}/${maxRetry} — http error: ${e?.response?.status || e.message}`)
    }
  }
  throw new Error("Timeout: file tidak selesai diproses setelah beberapa percobaan.")
}

function parseSize(sizeStr) {
  if (!sizeStr) return 0
  const match = sizeStr.match(/([\d.]+)\s*(MB|GB|KB)/i)
  if (!match) return 0
  const val = parseFloat(match[1])
  const unit = match[2].toUpperCase()
  if (unit === "GB") return val * 1024
  if (unit === "KB") return val / 1024
  return val
}

function normalizeQuality(q) {
  if (!q) return null
  q = q.trim().toLowerCase()
  if (/^\d+p$/.test(q)) return q
  if (/^\d+k$/.test(q)) return q.slice(0, -1) + "K"
  if (/^\d+$/.test(q)) return q + "K"
  return q
}

function getResLabel(item) {
  if (typeof item.mediaRes === "string") {
    const m = item.mediaRes.match(/\d+x(\d+)/)
    if (m) return m[1] + "p"
  }
  const urlMatch = item.mediaUrl?.match(/\/(\d+[pk])$/i)
  if (urlMatch) return urlMatch[1].replace(/k$/i, "K")
  return null
}

function matchQuality(item, targetQ) {
  if (!targetQ) return false
  const t = targetQ.toLowerCase()
  const q = (item.mediaQuality || "").toLowerCase()
  if (item.type === "Video") {
    const resLabel = getResLabel(item)?.toLowerCase()
    return resLabel === t || q === t
  }
  if (item.type === "Audio") {
    return q === t
  }
  return false
}

const handler = async (m, { reply, conn, args, command }) => {
  const isAudio = ["ytmp3", "yta"].includes(command)

  const url = args[0]
  if (!url) return reply(
    `Kirim link YouTube nya!\n` +
    `Contoh: .${command} https://youtu.be/xxx [kualitas]\n\n` +
    `Default → video: *720p* | audio: *48K*`
  )

  const requestedQ = args[1] ? normalizeQuality(args[1]) : null
  const defaultQ   = isAudio ? "48K" : "720p"
  const targetQ    = requestedQ || defaultQ

  reply(`⏳ Memproses ${isAudio ? "audio" : "video"} *${targetQ}*, mohon tunggu...`)

  try {
    const res = await ytdown(url)
    if (res.status !== "ok") return reply("❌ Gagal mengambil data video.")

    const typeFilter = isAudio ? "Audio" : "Video"
    const allItems   = res.mediaItems.filter(i => i.type === typeFilter)
    if (!allItems.length) return reply("❌ Tidak ada media tersedia.")

    const selected = allItems.find(i => matchQuality(i, targetQ)) || allItems[0]
    const resLabel = getResLabel(selected)

    // ── Resolve fileUrl (dengan delay + retry) ──
    const { fileUrl, fileName, fileSize } = await resolveFileUrl(selected.mediaUrl)
    const sizeMB = parseSize(fileSize || selected.mediaFileSize)

    const caption = isAudio
      ? `🎵 *${res.title}*\n🔊 Kualitas: ${selected.mediaQuality}\n⏱ Durasi: ${selected.mediaDuration}\n💾 Ukuran: ${fileSize || selected.mediaFileSize}`
      : `🎬 *${res.title}*\n📺 Kualitas: ${resLabel || selected.mediaQuality}${typeof selected.mediaRes === "string" ? ` (${selected.mediaRes})` : ""}\n⏱ Durasi: ${selected.mediaDuration}\n💾 Ukuran: ${fileSize || selected.mediaFileSize}`

    // ── Kirim file ──
    if (isAudio) {
      if (sizeMB > 100) {
        await conn.sendMessage(m.chat, {
          document: { url: fileUrl },
          mimetype: "audio/mp4",
          fileName: fileName || `${res.title}.${selected.mediaExtension.toLowerCase()}`,
          caption
        }, { quoted: m })
      } else {
        await conn.sendMessage(m.chat, {
          audio: { url: fileUrl },
          mimetype: "audio/mp4",
          ptt: false,
          caption
        }, { quoted: m })
      }
    } else {
      if (sizeMB > 70) {
        await conn.sendMessage(m.chat, {
          document: { url: fileUrl },
          mimetype: "video/mp4",
          fileName: fileName || `${res.title}.${selected.mediaExtension.toLowerCase()}`,
          caption
        }, { quoted: m })
      } else {
        await conn.sendMessage(m.chat, {
          video: { url: fileUrl },
          mimetype: "video/mp4",
          caption
        }, { quoted: m })
      }
    }

    // ── Kirim list kualitas tersedia ──
    let list = `📋 *Kualitas tersedia:*\n\n`
    allItems.forEach((item, i) => {
      const mark = item === selected ? "✅" : "▪️"
      if (isAudio) {
        list += `${mark} *${i + 1}.* 🔊 ${item.mediaQuality} — ${item.mediaExtension} — ${item.mediaFileSize}\n`
      } else {
        const rl = getResLabel(item) || item.mediaQuality
        const r2 = typeof item.mediaRes === "string" ? ` (${item.mediaRes})` : ""
        list += `${mark} *${i + 1}.* 📺 ${rl}${r2} — ${item.mediaExtension} — ${item.mediaFileSize}\n`
      }
    })

    list += `\n💡 *Contoh pilih kualitas lain:*\n`
    allItems.forEach(item => {
      if (item === selected) return
      if (isAudio) {
        list += `› .${command} <url> ${item.mediaQuality.toLowerCase()}\n`
      } else {
        const rl = getResLabel(item) || item.mediaQuality
        list += `› .${command} <url> ${rl}\n`
      }
    })

    await reply(list)

  } catch (e) {
    console.error(e)
    reply("❌ Error: " + e.message)
  }
}

handler.command = ["ytmp3", "yta", "ytmp4", "ytv"]
handler.tags = ['downloader'];
handler.help = ['ytmp3', 'ytmp4'];
module.exports = handler