const axios = require("axios");

async function generateImage(prompt, count = 1) {
    try {
        const url = `https://1yjs1yldj7.execute-api.us-east-1.amazonaws.com/default/ai_image?prompt=${encodeURIComponent(prompt)}&aspect_ratio=1:1&link=writecream.com`;

        const headers = {
            "User-Agent":
                "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36",
            "Referer": "https://www.writecream.com/ai-image-generator-free-no-sign-up/",
        };

        const images = [];
        for (let i = 0; i < count; i++) {
            const response = await axios.get(url, { headers });
            if (response.data && response.data.image_link) {
                images.push(response.data.image_link);
            }
        }

        return { success: true, imageUrls: images };
    } catch (error) {
        return {
            success: false,
            message: "Terjadi kesalahan",
            error: error.response ? error.response.data : error.message,
        };
    }
}

module.exports = generateImage;