const crypto = require('crypto');
const { uploadServers, serverExpiration, detectFileType, formatSize } = require('#scrape/uploder');

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const [num, ...raw] = (text || '').split(' ');
    const selected = num;
    const customArg = raw.length ? raw.join(' ').trim() : null;

    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || '';

    const serverNames = Object.keys(uploadServers).sort((a, b) => a.localeCompare(b));
    
    const list = serverNames.map((name, i) => {
        const exp = serverExpiration[name] || 'Tidak Diketahui';
        return `${String(i + 1).padStart(2, '0')}. ${name} (⏰ ${exp})`;
    }).join('\n');

    if (!mime || !selected) {
        return m.reply(`\`\`\`Pilih server uploader:\`\`\`\n\`\`\`${list}\`\`\`\n\n*C O N T O H:*\n> *• Reply Media* \`${usedPrefix + command} 2\`\n> *• Upload ke Semua CDN* \`${usedPrefix + command} all\`\n> *• GitHub (Custom)* \`${usedPrefix + command} 13 folder|nama|nama_file\``);
    }

    const isUploadAll = selected.toLowerCase() === 'all';

    if (!isUploadAll) {
        let index = parseInt(selected) - 1;
        if (isNaN(index) || !serverNames[index]) {
            return m.reply(`> [ × ] Nomor server *tidak valid!*\n> Gunakan \`${usedPrefix + command}\` untuk melihat daftar server.`);
        }
    }

    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

    let media;
    try {
        media = await q.download();
    } catch (e) {
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return m.reply('> [ × ] Gagal download media!');
    }

    if (!media) {
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return m.reply('> [ × ] Gagal download media!');
    }

    const info = await detectFileType(media);
    const fileSize = formatSize(media.length);
    const fileName = `${crypto.randomBytes(4).toString('hex')}.${info.ext}`;
    const uploadDate = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }).replace(',', '');

    if (isUploadAll) {
        const results = [];
        let successCount = 0;
        let failCount = 0;

        await m.reply(`> [ ⏳ ] Mengupload ke *${serverNames.length} server*...\n> Mohon tunggu...`);

        for (let i = 0; i < serverNames.length; i++) {
            const serverName = serverNames[i];
            const uploadFn = uploadServers[serverName];

            try {
                let url;
                url = await uploadFn(media, fileName, mime, customArg);

                if (url === '[CUSTOM_FORMAT_ERROR]') {
                    results.push({
                        server: serverName,
                        status: 'SKIP',
                        reason: 'Format custom tidak valid'
                    });
                    failCount++;
                    continue;
                }

                if (url?.startsWith('http')) {
                    results.push({
                        server: serverName,
                        status: 'SUCCESS',
                        url: url,
                        exp: serverExpiration[serverName] || 'Tidak Diketahui'
                    });
                    successCount++;
                } else {
                    throw new Error('Invalid URL or Error Response');
                }
            } catch (err) {
                results.push({
                    server: serverName,
                    status: 'FAILED',
                    reason: err.message || 'Server error'
                });
                failCount++;
            }
        }

        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        const successResults = results.filter(r => r.status === 'SUCCESS');
        const failedResults = results.filter(r => r.status === 'FAILED' || r.status === 'SKIP');

        let resultText = `*[ √ ] UPLOAD ALL SELESAI*\n\n`;
        resultText += `• *Total Success:* ${successCount}/${serverNames.length}\n`;
        resultText += `• *Total Failed:* ${failCount}/${serverNames.length}\n`;
        resultText += `• *File Size:* ${fileSize}\n`;
        resultText += `• *Type:* ${mime || info.mime}\n\n`;

        if (successResults.length > 0) {
            resultText += `*✅ BERHASIL:*\n`;
            successResults.forEach((r, i) => {
                resultText += `${i + 1}. *${r.server}*\n`;
                resultText += `   ⏰ Exp: ${r.exp}\n`;
                resultText += `   🔗 ${r.url}\n\n`;
            });
        }

        if (failedResults.length > 0) {
            resultText += `\n*❌ GAGAL/SKIP:*\n`;
            failedResults.forEach((r, i) => {
                resultText += `${i + 1}. ${r.server} - ${r.reason || r.status}\n`;
            });
        }

        return m.reply(resultText);
    }

    let url = null;
    let usedServer = null;
    let index = parseInt(selected) - 1;

    for (let i = index; i < serverNames.length; i++) {
        const serverName = serverNames[i];
        const uploadFn = uploadServers[serverName];

        try {
            url = await uploadFn(media, fileName, mime, customArg);

            if (url === '[CUSTOM_FORMAT_ERROR]') {
                return m.reply(`> [ × ] Format custom tidak valid!\n\n*Gunakan:*\n\`${usedPrefix + command} 13 folder1|folder2|nama_file\`\n\n*Contoh:*\n\`${usedPrefix + command} 13 sticker|patrick|nama\`\n\n*Atau gunakan tanpa custom path:*\n\`${usedPrefix + command} 13\``);
            }

            if (url?.startsWith('http')) {
                usedServer = serverName;
                break;
            } else {
                throw new Error('Invalid URL');
            }
        } catch {
            const next = serverNames[i + 1];
            if (next) {
                await m.reply(`> [ ! ] Server *${serverName}* error, pindah ke *${next}*...`);
            } else {
                await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return m.reply('> [ × ] Semua server gagal!');
            }
        }
    }

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

    if (!url) return m.reply('> [ × ] Tidak ada respon server!');

    if (url === '[SUPPORT_ERROR]') return m.reply(`> [ × ] Uploader *${usedServer}* tidak mendukung jenis file ini.`);

    if (url === '[SERVER_ERROR]') return m.reply(`> [ × ] Server *${usedServer}* sedang bermasalah.`);

    const expInfo = serverExpiration[usedServer] || 'Tidak Diketahui';

    let fileIcon = '📄';
    let thumbnailUrl = 'https://i.ibb.co/2Ks91C7/file-icon.png';

    if (info.mime && info.mime.startsWith('image/')) {
        fileIcon = '🖼️';
        thumbnailUrl = url;
    } else if (info.mime && info.mime.startsWith('video/')) {
        fileIcon = '🎥';
        thumbnailUrl = url;
    } else if (info.mime && info.mime.startsWith('audio/')) {
        fileIcon = '🎵';
    } else {
        fileIcon = '📄';
    }

    const caption = `*[ √ ] UPLOAD SUCCESS* ${fileIcon}

• *File Size:* ${fileSize}
• *Server:* ${usedServer}
• *Type:* ${mime || info.mime}
• *Upload Date:* ${uploadDate}
• *Expiration:* ${expInfo}
• *Link:* ${url}`;

    return m.reply(caption);
};

handler.help = ['tourl <nomor>'];
handler.tags = ['tools'];
handler.command = ["tourl", "url"]
handler.register = true;

module.exports = handler;