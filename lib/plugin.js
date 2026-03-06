const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

function matchCommand(plugin, command) {
    if (!plugin.command) return false
    if (plugin.command instanceof RegExp)
        return plugin.command.test(command)
    if (Array.isArray(plugin.command))
        return plugin.command.some(c =>
            c instanceof RegExp ? c.test(command) : c.toString().toLowerCase() === command.toLowerCase()
        )
    return false
}

async function loadPlugin(fullPath) {
    const isMjs = fullPath.endsWith('.mjs')
    if (isMjs) {
        const { pathToFileURL } = require('url')
        const dynamicImport = new Function('url', 'return import(url)')
        return await dynamicImport(pathToFileURL(fullPath).href)
    }
    const resolvedPath = require.resolve(fullPath)
    delete require.cache[resolvedPath]
    return require(fullPath)
}

async function pluginsLoader(directory) {
    const plugins = []
    const beforeHooks = []
    const allHooks = []

    async function loadDir(dir) {
        if (!fs.existsSync(dir)) return
        const items = fs.readdirSync(dir).sort()
        for (const item of items) {
            const fullPath = path.join(dir, item)
            const stat = fs.statSync(fullPath)
            if (stat.isDirectory()) { await loadDir(fullPath); continue }
            if (!item.endsWith('.js') && !item.endsWith('.mjs')) continue
            try {
                const mod = await loadPlugin(fullPath)
                let plugin = mod?.default ?? mod

                if (typeof mod?.before === 'function') beforeHooks.push({ fn: mod.before, ctx: mod })
                if (typeof mod?.all === 'function') allHooks.push({ fn: mod.all, ctx: mod })

                if (plugin && typeof plugin !== 'function') {
                    if (typeof plugin.before === 'function') beforeHooks.push({ fn: plugin.before, ctx: plugin })
                    if (typeof plugin.all === 'function') allHooks.push({ fn: plugin.all, ctx: plugin })
                    if (typeof plugin.default === 'function') plugin = plugin.default
                }

                if (typeof plugin === 'function') {
                    if (typeof plugin.before === 'function') beforeHooks.push({ fn: plugin.before, ctx: plugin })
                    if (typeof plugin.all === 'function') allHooks.push({ fn: plugin.all, ctx: plugin })
                    plugins.push(plugin)
                }
            } catch (err) {
                console.log(`[plugin] Error loading ${path.basename(fullPath)}: ${err.message}`)
            }
        }
    }

    await loadDir(directory)
    return { plugins, beforeHooks, allHooks }
}

module.exports = { pluginsLoader, matchCommand }

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(`Update ${__filename}`)
    delete require.cache[file]
    require(file)
})
