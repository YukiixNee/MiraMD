const { proto, getContentType, areJidsSameUser } = require('baileys')
const { modul } = require('#modul')
const { axios, moment, util, fs, chalk } = modul

const unixTimestampSeconds = (date = new Date()) => Math.floor(date.getTime() / 1000)

exports.unixTimestampSeconds = unixTimestampSeconds

exports.generateMessageTag = (epoch) => {
    let tag = (0, exports.unixTimestampSeconds)().toString();
    if (epoch)
        tag += '.--' + epoch; 
    return tag;
}

exports.processTime = (timestamp, now) => {
	return moment.duration(now - moment(timestamp * 1000)).asSeconds()
}

exports.getRandom = (ext) => {
    return `${Math.floor(Math.random() * 10000)}${ext}`
}

exports.getBuffer = async (url, options) => {
	try {
		options ? options : {}
		const res = await axios({
			method: "get",
			url,
			headers: {
				'DNT': 1,
				'Upgrade-Insecure-Request': 1
			},
			...options,
			responseType: 'arraybuffer'
		})
		return res.data
	} catch (err) {
		return err
	}
}

exports.capital = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

exports.fetchJson = async (url, options) => {
    try {
        options ? options : {}
        const res = await axios({
            method: 'GET',
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            },
            ...options
        })
        return res.data
    } catch (err) {
        return err
    }
}

exports.runtime = function(seconds) {
	seconds = Number(seconds);
	var d = Math.floor(seconds / (3600 * 24));
	var h = Math.floor(seconds % (3600 * 24) / 3600);
	var m = Math.floor(seconds % 3600 / 60);
	var s = Math.floor(seconds % 60);
	var dDisplay = d > 0 ? d + (d == 1 ? " hari, " : " hari, ") : "";
	var hDisplay = h > 0 ? h + (h == 1 ? " jam, " : " jam, ") : "";
	var mDisplay = m > 0 ? m + (m == 1 ? " menit, " : " menit, ") : "";
	var sDisplay = s > 0 ? s + (s == 1 ? " detik" : " detik") : "";
	return dDisplay + hDisplay + mDisplay + sDisplay;
}

exports.clockString = (ms) => {
    let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
    let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
    let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}

exports.sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

exports.isUrl = (url) => {
    return url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/, 'gi'))
}

exports.getTime = (format, date) => {
	if (date) {
		return moment(date).locale('id').format(format)
	} else {
		return moment.tz('Asia/Jakarta').locale('id').format(format)
	}
}

exports.formatDate = (n, locale = 'id') => {
	let d = new Date(n)
	return d.toLocaleDateString(locale, {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric'
	})
}

exports.tanggal = (numer) => {
	myMonths = ["𝖩𝖺𝗇𝗎𝖺𝗋𝗂","𝖥𝖾𝖻𝗋𝗎𝖺𝗋𝗂","𝖬𝖺𝗋𝖾𝗍","𝖠𝗉𝗋𝗂𝗅","𝖬𝖾𝗂","𝖩𝗎𝗇𝗂","𝖩𝗎𝗅𝗂","𝖠𝗀𝗎𝗌𝗍𝗎𝗌","𝖲𝖾𝗉𝗍𝖾𝗆𝖻𝖾𝗋","𝖮𝗄𝗍𝗈𝖻𝖾𝗋","𝖭𝗈𝗏𝖾𝗆𝖻𝖾𝗋","𝖣𝖾𝗌𝖾𝗆𝖻𝖾𝗋"];
				myDays = ['𝖬𝗂𝗇𝗀𝗀𝗎','𝖲𝖾𝗇𝗂𝗇','𝖲𝖾𝗅𝖺𝗌𝖺','𝖱𝖺𝖻𝗎','𝖪𝖺𝗆𝗂𝗌','𝖩𝗎𝗆𝖺𝗍','𝖲𝖺𝖻𝗍𝗎']; 
				var tgl = new Date(numer);
				var day = tgl.getDate()
				bulan = tgl.getMonth()
				var thisDay = tgl.getDay(),
				thisDay = myDays[thisDay];
				var yy = tgl.getYear()
				var year = (yy < 1000) ? yy + 1900 : yy; 
				const time = moment.tz('Asia/Jakarta').format('DD/MM HH:mm:ss')
				let d = new Date
				let locale = 'id'
				let gmt = new Date(0).getTime() - new Date('1 January 1970').getTime()
				let weton = ['Pahing', 'Pon','Wage','Kliwon','Legi'][Math.floor(((d * 1) + gmt) / 84600000) % 5]
				return`${day}`
}

exports.day = (numer) => {
	myMonths = ["𝖩𝖺𝗇𝗎𝖺𝗋𝗂","𝖥𝖾𝖻𝗋𝗎𝖺𝗋𝗂","𝖬𝖺𝗋𝖾𝗍","𝖠𝗉𝗋𝗂𝗅","𝖬𝖾𝗂","𝖩𝗎𝗇𝗂","𝖩𝗎𝗅𝗂","𝖠𝗀𝗎𝗌𝗍𝗎𝗌","𝖲𝖾𝗉𝗍𝖾𝗆𝖻𝖾𝗋","𝖮𝗄𝗍𝗈𝖻𝖾𝗋","𝖭𝗈𝗏𝖾𝗆𝖻𝖾𝗋","𝖣𝖾𝗌𝖾𝗆𝖻𝖾𝗋"];
				myDays = ['𝖬𝗂𝗇𝗀𝗀𝗎','𝖲𝖾𝗇𝗂𝗇','𝖲𝖾𝗅𝖺𝗌𝖺','𝖱𝖺𝖻𝗎','𝖪𝖺𝗆𝗂𝗌','𝖩𝗎𝗆𝖺𝗍','𝖲𝖺𝖻𝗍𝗎']; 
				var tgl = new Date(numer);
				var day = tgl.getDate()
				bulan = tgl.getMonth()
				var thisDay = tgl.getDay(),
				thisDay = myDays[thisDay];
				var yy = tgl.getYear()
				var year = (yy < 1000) ? yy + 1900 : yy; 
				const time = moment.tz('Asia/Jakarta').format('DD/MM HH:mm:ss')
				let d = new Date
				let locale = 'id'
				let gmt = new Date(0).getTime() - new Date('1 January 1970').getTime()
				let weton = ['Pahing', 'Pon','Wage','Kliwon','Legi'][Math.floor(((d * 1) + gmt) / 84600000) % 5]
				return`${thisDay}` 		
}

exports.bulan = (numer) => {
	myMonths = ["𝖩𝖺𝗇𝗎𝖺𝗋𝗂","𝖥𝖾𝖻𝗋𝗎𝖺𝗋𝗂","𝖬𝖺𝗋𝖾𝗍","𝖠𝗉𝗋𝗂𝗅","𝖬𝖾𝗂","𝖩𝗎𝗇𝗂","𝖩𝗎𝗅𝗂","𝖠𝗀𝗎𝗌𝗍𝗎𝗌","𝖲𝖾𝗉𝗍𝖾𝗆𝖻𝖾𝗋","𝖮𝗄𝗍𝗈𝖻𝖾𝗋","𝖭𝗈𝗏𝖾𝗆𝖻𝖾𝗋","𝖣𝖾𝗌𝖾𝗆𝖻𝖾𝗋"];
				myDays = ['𝖬𝗂𝗇𝗀𝗀𝗎','𝖲𝖾𝗇𝗂𝗇','𝖲𝖾𝗅𝖺𝗌𝖺','𝖱𝖺𝖻𝗎','𝖪𝖺𝗆𝗂𝗌','𝖩𝗎𝗆𝖺𝗍','𝖲𝖺𝖻𝗍𝗎']; 
				var tgl = new Date(numer);
				var day = tgl.getDate()
				bulan = tgl.getMonth()
				var thisDay = tgl.getDay(),
				thisDay = myDays[thisDay];
				var yy = tgl.getYear()
				var year = (yy < 1000) ? yy + 1900 : yy; 
				const time = moment.tz('Asia/Jakarta').format('DD/MM HH:mm:ss')
				let d = new Date
				let locale = 'id'
				let gmt = new Date(0).getTime() - new Date('1 January 1970').getTime()
				let weton = ['Pahing', 'Pon','Wage','Kliwon','Legi'][Math.floor(((d * 1) + gmt) / 84600000) % 5]
				return`${myMonths[bulan]}`
}

exports.tahun = (numer) => {
	myMonths = ["𝖩𝖺𝗇𝗎𝖺𝗋𝗂","𝖥𝖾𝖻𝗋𝗎𝖺𝗋𝗂","𝖬𝖺𝗋𝖾𝗍","𝖠𝗉𝗋𝗂𝗅","𝖬𝖾𝗂","𝖩𝗎𝗇𝗂","𝖩𝗎𝗅𝗂","𝖠𝗀𝗎𝗌𝗍𝗎𝗌","𝖲𝖾𝗉𝗍𝖾𝗆𝖻𝖾𝗋","𝖮𝗄𝗍𝗈𝖻𝖾𝗋","𝖭𝗈𝗏𝖾𝗆𝖻𝖾𝗋","𝖣𝖾𝗌𝖾𝗆𝖻𝖾𝗋"];
				myDays = ['𝖬𝗂𝗇𝗀𝗀𝗎','𝖲𝖾𝗇𝗂𝗇','𝖲𝖾𝗅𝖺𝗌𝖺','𝖱𝖺𝖻𝗎','𝖪𝖺𝗆𝗂𝗌','𝖩𝗎𝗆𝖺𝗍','𝖲𝖺𝖻𝗍𝗎']; 
				var tgl = new Date(numer);
				var day = tgl.getDate()
				bulan = tgl.getMonth()
				var thisDay = tgl.getDay(),
				thisDay = myDays[thisDay];
				var yy = tgl.getYear()
				var year = (yy < 1000) ? yy + 1900 : yy; 
				const time = moment.tz('Asia/Jakarta').format('DD/MM HH:mm:ss')
				let d = new Date
				let locale = 'id'
				let gmt = new Date(0).getTime() - new Date('1 January 1970').getTime()
				let weton = ['Pahing', 'Pon','Wage','Kliwon','Legi'][Math.floor(((d * 1) + gmt) / 84600000) % 5]
				return`${year}` 		
}

exports.weton = (numer) => {
	myMonths = ["𝖩𝖺𝗇𝗎𝖺𝗋𝗂","𝖥𝖾𝖻𝗋𝗎𝖺𝗋𝗂","𝖬𝖺𝗋𝖾𝗍","𝖠𝗉𝗋𝗂𝗅","𝖬𝖾𝗂","𝖩𝗎𝗇𝗂","𝖩𝗎𝗅𝗂","𝖠𝗀𝗎𝗌𝗍𝗎𝗌","𝖲𝖾𝗉𝗍𝖾𝗆𝖻𝖾𝗋","𝖮𝗄𝗍𝗈𝖻𝖾𝗋","𝖭𝗈𝗏𝖾𝗆𝖻𝖾𝗋","𝖣𝖾𝗌𝖾𝗆𝖻𝖾𝗋"];
				myDays = ['𝖬𝗂𝗇𝗀𝗀𝗎','𝖲𝖾𝗇𝗂𝗇','𝖲𝖾𝗅𝖺𝗌𝖺','𝖱𝖺𝖻𝗎','𝖪𝖺𝗆𝗂𝗌','𝖩𝗎𝗆𝖺𝗍','𝖲𝖺𝖻𝗍𝗎']; 
				var tgl = new Date(numer);
				var day = tgl.getDate()
				bulan = tgl.getMonth()
				var thisDay = tgl.getDay(),
				thisDay = myDays[thisDay];
				var yy = tgl.getYear()
				var year = (yy < 1000) ? yy + 1900 : yy; 
				const time = moment.tz('Asia/Jakarta').format('DD/MM HH:mm:ss')
				let d = new Date
				let locale = 'id'
				let gmt = new Date(0).getTime() - new Date('1 January 1970').getTime()
				let weton = ['Pahing', 'Pon','Wage','Kliwon','Legi'][Math.floor(((d * 1) + gmt) / 84600000) % 5]
				return`${weton}`
}

exports.jsonformat = (string) => {
    return JSON.stringify(string, null, 2)
}

function format(...args) {
	return util.format(...args)
}

exports.logic = (check, inp, out) => {
	if (inp.length !== out.length) throw new Error('Input and Output must have same length')
	for (let i in inp)
		if (util.isDeepStrictEqual(check, inp[i])) return out[i]
	return null
}

exports.bytesToSize = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

exports.getSizeMedia = (path) => {
    return new Promise((resolve, reject) => {
        if (/http/.test(path)) {
            axios.get(path)
            .then((res) => {
                let length = parseInt(res.headers['content-length'])
                let size = exports.bytesToSize(length, 3)
                if(!isNaN(length)) resolve(size)
            })
        } else if (Buffer.isBuffer(path)) {
            let length = Buffer.byteLength(path)
            let size = exports.bytesToSize(length, 3)
            if(!isNaN(length)) resolve(size)
        } else {
            reject('error')
        }
    })
}

exports.parseMention = (text = '') => {
    return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
}

exports.resolveMentions = (mentionedJid = [], text = '', participants = []) => {
    const all = [...new Set([...mentionedJid, ...[...(text || '').matchAll(/@([0-9]{5,16})/g)].map(v => v[1] + '@lid')])]
    return all.map(jid => {
        const n = jid.split('@')[0]
        const p = participants.find(p => p.lid === jid || p.id === jid || p.jid?.split('@')[0] === n)
        return (p?.jid && !p.jid.endsWith('@lid')) ? p.jid : (jid.endsWith('@lid') ? null : jid)
    }).filter(Boolean)
}

exports.getGroupAdmins = (participants) => {
        let admins = []
        for (let i of participants) {
            i.admin === "superadmin" ? admins.push(i.id) :  i.admin === "admin" ? admins.push(i.id) : ''
        }
        return admins || []
     }

const resolveParticipantJid = (conn, lid, chat, store) => {
    if (!lid) return lid
    if (!lid.endsWith('@lid')) return lid
    try {
        const metas = [
            store?.groupMetadata?.[chat],
            ...Object.values(store?.groupMetadata || {})
        ].filter(Boolean)
        for (const meta of metas) {
            if (!meta?.participants) continue
            const found = meta.participants.find(p => p.lid === lid || p.id === lid)
            if (!found) continue
            if (found.jid && !found.jid.endsWith('@lid')) return found.jid
            if (found.phoneNumber && found.phoneNumber.endsWith('@s.whatsapp.net')) return found.phoneNumber
        }
    } catch {}
    return null
}

exports.smsg = (conn, m, store) => {
    if (!m) return m;
    let M = proto.WebMessageInfo;
    if (m.key) {
        const rawId = m.key.id || ''
        m.id = rawId.startsWith('MIRA-') ? rawId : 'MIRA-' + rawId.slice(-16)
        m.isBaileys = rawId.startsWith('BAE5') && rawId.length === 16;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith('@g.us');
        const _rawSender = conn.decodeJid(m.fromMe && conn.user.id || m.participant || m.key.participant || m.chat || '')
        m.sender = resolveParticipantJid(conn, _rawSender, m.chat, store) || _rawSender
        if (m.isGroup) {
            const _rawPart = conn.decodeJid(m.key.participant) || ''
            m.participant = resolveParticipantJid(conn, _rawPart, m.chat, store) || _rawPart
        }
    }
    if (m.message) {
        m.mtype = getContentType(m.message);
        m.msg = (m.mtype === 'viewOnceMessage' ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] : m.message[m.mtype]);
        m.body = 
            m.message?.conversation || 
            m.msg?.caption || 
            m.msg?.text || 
            (m.mtype === 'listResponseMessage' && m.msg?.singleSelectReply?.selectedRowId) || 
            (m.mtype === 'buttonsResponseMessage' && m.msg?.selectedButtonId) || 
            (m.mtype === 'viewOnceMessage' && m.msg?.caption) || 
            m.text || '';

        let quoted = m.quoted = m.msg?.contextInfo?.quotedMessage || null; 
        m.mentionedJid = (m.msg?.contextInfo?.mentionedJid || []).map(j => resolveParticipantJid(conn, j, m.chat, store) || j).filter(j => j && !j.endsWith('@lid'))
        if (m.quoted) {
            let type = Object.keys(m.quoted)[0];
            m.quoted = m.quoted[type];
            if (['productMessage'].includes(type)) {
                type = Object.keys(m.quoted)[0];
                m.quoted = m.quoted[type];
            }
            if (typeof m.quoted === 'string') m.quoted = { text: m.quoted };
            m.quoted.mtype = type;
            const rawQuotedId = m.msg?.contextInfo?.stanzaId || ''
            m.quoted.id = rawQuotedId
                ? (rawQuotedId.startsWith('MIRA-') ? rawQuotedId : 'MIRA-' + rawQuotedId.slice(-16))
                : ''
            m.quoted.chat = m.msg?.contextInfo?.remoteJid || m.chat;
            m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16 : false;
            const _rawQSender = conn.decodeJid(m.msg?.contextInfo?.participant)
            m.quoted.sender = resolveParticipantJid(conn, _rawQSender, m.quoted.chat || m.chat, store) || _rawQSender
            m.quoted.fromMe = m.quoted.sender === conn.decodeJid(conn.user.id);

            m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || m.quoted.contentText || m.quoted.selectedDisplayText || m.quoted.title || '';
            m.quoted.mentionedJid = (m.msg?.contextInfo?.mentionedJid || []).map(j => resolveParticipantJid(conn, j, m.chat, store) || j).filter(j => j && !j.endsWith('@lid'))
            m.getQuotedObj = m.getQuotedMessage = async () => {
                if (!m.quoted.id) return false;
                let q = await store.loadMessage(m.chat, m.quoted.id, conn);
                return exports.smsg(conn, q, store);
            };
            let vM = m.quoted.fakeObj = M.fromObject({
                key: {
                    remoteJid: m.quoted.chat,
                    fromMe: m.quoted.fromMe,
                    id: m.quoted.id
                },
                message: quoted,
                ...(m.isGroup ? { participant: m.quoted.sender } : {})
            });

            m.quoted.delete = () => conn.sendMessage(m.quoted.chat, { delete: vM.key });
            m.quoted.copyNForward = (jid, forceForward = false, options = {}) => conn.copyNForward(jid, vM, forceForward, options);
            m.quoted.download = () => conn.downloadMediaMessage(m.quoted);
        }
    }
    if (m.msg?.url) m.download = () => conn.downloadMediaMessage(m.msg);
    m.text = m.msg?.text || m.msg?.caption || m.message?.conversation || m.msg?.contentText || m.msg?.selectedDisplayText || m.msg?.title || '';
    m.reply = (text, chatId = m.chat, options = {}) => Buffer.isBuffer(text) ? conn.sendMedia(chatId, text, 'file', '', m, { ...options }) : conn.sendText(chatId, text, m, { ...options });
    m.copy = () => exports.smsg(conn, M.fromObject(M.toObject(m)));
    m.copyNForward = (jid = m.chat, forceForward = false, options = {}) => conn.copyNForward(jid, m, forceForward, options);
    
    return m;
};

exports.fetchBuffer = async (url, options) => {
    try {
        options ? options : {}
        const res = await axios({
            method: "GET",
            url,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.70 Safari/537.36",
                'DNT': 1,
                'Upgrade-Insecure-Request': 1
            },
            ...options,
            responseType: 'arraybuffer'
        })
        return res.data
    } catch (err) {
        return err
    }
}

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`${__filename} Update`))
    delete require.cache[file]
    require(file)
})
