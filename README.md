<div align="center">

# 🤖 MiraMD
**WhatsApp Bot berbasis [Baileys (Wileys)](https://github.com/NaufalYupra) — Node.js**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?style=flat-square&logo=node.js)](https://nodejs.org)
[![Baileys](https://img.shields.io/badge/Baileys-Wileys-blue?style=flat-square)](https://github.com/whiskeysockets/baileys)
[![License](https://img.shields.io/badge/License-ISC-yellow?style=flat-square)](LICENSE)
[![Author](https://img.shields.io/badge/Author-ShiinjiZX-purple?style=flat-square)](https://github.com/ShiinjiZX)

</div>

---

## 📋 Daftar Isi
- [Fitur](#-fitur)
- [Struktur Folder](#-struktur-folder)
- [Instalasi](#-instalasi)
- [Konfigurasi](#️-konfigurasi)
- [Menjalankan Bot](#-menjalankan-bot)
- [Sistem Plugin](#-sistem-plugin)
- [Perintah Bawaan](#-perintah-bawaan)
- [Database](#-database)

---

## ✨ Fitur

- 📦 **Plugin System** — Mendukung `.js` dan `.mjs` (ESM), hot-reload tanpa restart
- 🎵 **Embedded Music** — Setiap pesan keluar menyertakan info bot via WA music annotation
- 🖼️ **Album Message** — Kirim banyak foto/video sekaligus dalam satu album
- 🔘 **Interactive Button** — Kirim pesan dengan tombol interaktif (native flow)
- 🔄 **LID Resolution** — Auto-resolve mention `@lid` ke nomor WA asli di grup
- 💾 **Dual Database** — Mendukung JSON lokal atau MongoDB
- 🛡️ **Permission System** — Owner, Premium, Admin, Bot Admin
- ⚙️ **3 Prefix** — Konfigurasi prefix `.` `/` `!` atau custom
- 📡 **Status React** — Auto-react emoji acak ke status WA kontak

---

## 📁 Struktur Folder

```
MiraMD/
├── index.js              # Entry point utama
├── settings.js           # Konfigurasi global bot
├── module.js             # Alias modul (#modul)
├── package.json
│
├── command/
│   ├── case.js           # Router perintah utama
│   └── plugins/          # Folder plugin
│       ├── ai/           # Plugin AI (vision, image gen, edit)
│       ├── downloader/   # Plugin downloader (YouTube, dll)
│       ├── group/        # Plugin manajemen grup
│       ├── owner/        # Plugin khusus owner
│       └── tools/        # Plugin tools umum
│
├── lib/
│   ├── simple.js         # Metode tambahan conn (sendFile, sendImage, dll)
│   ├── myfunc.js         # Utility functions + smsg serializer
│   ├── plugin.js         # Loader plugin (.js & .mjs)
│   ├── database.js       # Handler database per pesan
│   ├── loader.js         # Hot-reload module cache
│   ├── print.js          # Logger pesan di terminal
│   ├── user.js           # Handler incoming user
│   ├── color.js          # Warna terminal
│   ├── store/            # In-memory store Baileys
│   ├── lowdb/            # Adapter JSON database
│   └── mongoDB.js        # Adapter MongoDB
│
└── src/
    ├── database.json     # Data bot (users, chats, premium, dll)
    └── scrape/           # Module scraper
```

---

## 🚀 Instalasi

### Persyaratan
- **Node.js** v20 atau lebih baru
- **npm** v9+

### Langkah

```bash
# 1. Clone repository
git clone https://github.com/ShiinjiZX/MiraMD.git
cd MiraMD

# 2. Install dependencies
npm install

# 3. Salin dan edit konfigurasi
# Edit settings.js sesuai kebutuhan

# 4. Jalankan bot
npm start
```

---

## ⚙️ Konfigurasi

Edit file **`settings.js`**:

```js
// ── Pemilik Bot ──────────────────────────────────────────────
global.ownernumber = '628xxxxxxxxxx'   // Nomor WA owner (tanpa +)
global.ownername   = 'NamaOwner'

// ── Identitas Bot ────────────────────────────────────────────
global.namabot     = 'Mira - MD'
global.version     = '1.0.0'
global.prefix      = ['.', '/', '!']  // Bisa array atau string tunggal

// ── Database ─────────────────────────────────────────────────
global.useMongoDB   = false                          // true = pakai MongoDB
global.mongoURL     = 'mongodb+srv://...'            // URL MongoDB (jika useMongoDB = true)
global.localDBPath  = './src/database.json'          // Path JSON lokal

// ── Sticker ──────────────────────────────────────────────────
global.packname    = 'Nama Pack Sticker'
global.author      = 'NamaAuthor'
```

---

## ▶️ Menjalankan Bot

```bash
# Normal
npm start

# Atau langsung
node index.js
```

Saat pertama kali dijalankan, akan muncul Pairing code di terminal. Scan menggunakan WhatsApp > Perangkat Tertaut > Tautkan Perangkat > Tautakan Dengan Nomor Telepon.

---

## 🧩 Sistem Plugin

Plugin disimpan di `command/plugins/`. Mendukung format **CommonJS (`.js`)** dan **ES Module (`.mjs`)**.

### Contoh Plugin `.js`

```js
const handler = async (m, { conn, isOwner, isAdmin }) => {
    m.reply('Halo dari plugin!')
}

handler.command  = ['halo', 'hi']     // bisa string, array, atau RegExp
handler.tags     = ['tools']
handler.help     = ['halo']
handler.owner    = false              // hanya owner?
handler.premium  = false              // hanya premium?
handler.group    = false              // hanya di grup?
handler.admin    = false              // hanya admin grup?
handler.botAdmin = false              // bot harus admin?

module.exports = handler
```

### Contoh Plugin `.mjs`

```js
export default async function handler(m, { conn }) {
    m.reply('Plugin ESM!')
}

handler.command = /^test$/i
handler.tags    = ['tools']
```

### Hook `before` dan `all`

```js
// before: dijalankan sebelum command, return false untuk stop
export function before(m, { isOwner }) {
    if (m.text.includes('spam')) return false
}

// all: dijalankan untuk setiap pesan tanpa perlu command
export function all(m) {
    console.log('Pesan masuk:', m.text)
}
```

### Manajemen Plugin via Chat

```
.plugin list          - Lihat semua plugin aktif
.plugin add           - Upload plugin baru (kirim file .js/.mjs)
.plugin get nama.js   - Download plugin
.plugin del nama.js   - Hapus plugin
```

---

## 📜 Perintah Bawaan

### 👑 Owner
| Perintah | Keterangan |
|---|---|
| `.addprem @user 1d` | Tambah premium (h/d/w/m/y) |
| `.delprem @user` | Hapus premium user |
| `.listprem` | Daftar user premium |
| `.plugin list/add/del` | Manajemen plugin |
| `.backup` | Backup database |
| `.enable` / `.disable` | Aktif/nonaktif fitur |
| `.scrape` | Tool scraper |

### 👥 Grup
| Perintah | Keterangan |
|---|---|
| `.add nomor` | Tambah member |
| `.kick @user` | Keluarkan member |
| `.promote @user` | Jadikan admin |
| `.demote @user` | Copot admin |
| `.mute` / `.unmute` | Kunci/buka grup |
| `.banchat` | Ban chat di grup |

---

## 💾 Database

Struktur data di `src/database.json`:

```json
{
  "users": {
    "628xxx@s.whatsapp.net": {
      "premium": true,
      "premiumTime": 1234567890000,
      "exp": 0,
      "limit": 10
    }
  },
  "chats": {
    "120363xxx@g.us": {
      "welcome": true,
      "detect": true,
      "public": true
    }
  },
  "premium": ["628xxx@s.whatsapp.net"],
  "settings": {
    "628xxx@s.whatsapp.net": {
      "public": true,
      "gconly": false,
      "autoread": false
    }
  }
}
```

### Beralih ke MongoDB

```js
// settings.js
global.useMongoDB = true
global.mongoURL   = 'mongodb+srv://user:pass@cluster.mongodb.net/MiraMD'
```

---

## 🔧 API `conn` Tambahan (simple.js)

Metode yang ditambahkan ke koneksi Baileys:

```js
// Kirim teks
conn.sendText(jid, 'teks', quoted)

// Kirim file otomatis (deteksi tipe)
conn.sendFile(jid, buffer_atau_url, { caption: 'teks', quoted: m })

// Kirim gambar
conn.sendImage(jid, url_atau_buffer, 'caption', quoted)

// Download media dari pesan
conn.downloadMediaMessage(m.quoted)
```

---

## 📝 Lisensi

ISC © [ShiinjiZX](https://github.com/ShiinjiZX)

---

<div align="center">
Made with ❤️ by ShiinjiZX
</div>
