const generateImage = require("#scrape/aiImage");

const handler = async (m, { conn, args }) => {
    if (!args.length) 
        return m.reply(`Promptnya mana, Senpai?\nContoh: .aigen A chibi anime girl with long yellow hair`);

    m.reply("Sabar ya, Sensei, aku buatin gambarnya...");

    const prompt = args.join(" ");
    const result = await generateImage(prompt, 4);

    if (result.success) {

        if (!result.imageUrls || result.imageUrls.length === 0) {
            return m.reply("Yah, gagal bikin gambarnya, Sensei...");
        }

        const caption = `🖼️ AI Image Generator\n\n🎨 Prompt: ${prompt}\nJadi ${result.imageUrls.length} gambar nih, Sensei!`;

        for (let i = 0; i < result.imageUrls.length; i++) {
            await conn.sendMessage(
                m.chat,
                {
                    image: { url: result.imageUrls[i] },
                    caption: i === 0 ? caption : undefined
                },
                { quoted: m }
            );
        }

    } else {
        m.reply(`Gagal nih, Sensei: ${result.message}`);
    }
};

handler.help = ["aiimage"];
handler.tags = ["ai"];
handler.command = ["aiimage", "imagegen"];

module.exports = handler;