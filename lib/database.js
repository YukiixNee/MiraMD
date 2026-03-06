const fs = require('fs')
const path = require('path') 

const chalk = {
    green:     (s) => `\x1b[32m${s}\x1b[0m`,
    red:       (s) => `\x1b[31m${s}\x1b[0m`,
    redBright: (s) => `\x1b[91m${s}\x1b[0m`,
}

function defaultData() {
    return {
        users:    {},
        settings: {},
        chats:    {},   
        premium:  [],
        owner:    [],
    }
}

async function initDatabase() {
    try {
        if (global.useMongoDB && global.mongoURL) {
            const mongoose = require('mongoose')
            const { Schema } = mongoose

            await mongoose.connect(global.mongoURL, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            })

            let Model
            try {
                Model = mongoose.model('MiraMD')
            } catch {
                const schema = new Schema({ data: { type: Object, default: {} } })
                Model = mongoose.model('MiraMD', schema)
            }

            let doc = await Model.findOne({})
            if (!doc) {
                doc = await new Model({ data: defaultData() }).save()
            }

            global.db = {
                data: { ...defaultData(), ...doc.data },
                write: async () => {
                    await Model.findOneAndUpdate({}, { data: global.db.data }, { upsert: true })
                }
            }

            console.log(chalk.green('✅ Database MongoDB terhubung'))
        } else {
            const dbPath = path.resolve(global.localDBPath || './src/database.json')
            const dir = path.dirname(dbPath)
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

            let existing = defaultData()
            if (fs.existsSync(dbPath)) {
                try { existing = { ...defaultData(), ...JSON.parse(fs.readFileSync(dbPath, 'utf-8')) } }
                catch { existing = defaultData() }
            }

            global.db = {
                data: existing,
                write: async () => {
                    fs.writeFileSync(dbPath, JSON.stringify(global.db.data, null, 2))
                }
            }

            console.log(chalk.green(`✅ Database lokal: ${dbPath}`))
        }

        setInterval(async () => {
            try { await global.db.write() } catch {}
        }, 30_000)

    } catch (e) {
        console.error(chalk.red('❌ Database Error:'), e)
        process.exit(1)
    }
}

function loadDatabase(m, conn) {
    try {
        if (!global.db?.data) return

        const defaultUser = {
            name: m.pushName || '',
            premium: false,
            premiumTime: 0,
        }

        const defaultSettings = {
            public:   true,
            autoread: false,
            anticall: false,
            gconly:   false,
            pconly:   false,
        }

        if (!global.db.data.users)    global.db.data.users    = {}
        if (!global.db.data.settings) global.db.data.settings = {}
        if (!global.db.data.premium)  global.db.data.premium  = []
        if (!global.db.data.owner)    global.db.data.owner    = []
        if (!global.db.data.chats)    global.db.data.chats    = {}

        
        if (m.isGroup && m.chat?.endsWith('@g.us')) {
            const defaultChat = { mute: false, banchat: false }
            global.db.data.chats[m.chat] = {
                ...defaultChat,
                ...global.db.data.chats[m.chat],
            }
        }

        if (m.sender && m.sender.endsWith('@s.whatsapp.net')) {
            global.db.data.users[m.sender] = {
                ...defaultUser,
                ...global.db.data.users[m.sender],
                name: m.pushName || global.db.data.users[m.sender]?.name || '',
            }
        }

        const botJid = conn.user?.jid || conn.user?.id
        if (botJid) {
            global.db.data.settings[botJid] = {
                ...defaultSettings,
                ...global.db.data.settings[botJid],
            }
        }
    } catch (e) {
        console.error('loadDatabase Error:', e)
    }
}

module.exports = { initDatabase, loadDatabase }

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update ${__filename}`))
    delete require.cache[file]
    require(file)
})
