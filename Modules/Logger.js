const { discord } = require('../config.json');

module.exports = {
    async run(type, message) {
        try {
            if (!discord.guild) return console.log(message);
            if (!discord.log) return console.log(message);
            
            const fetchGuild = await client.guilds.fetch(discord.guild)
            const fetchChannel = await fetchGuild.channels.cache.get(discord.log);
            let format_message = `${formatDiscordTimestamp()} **\` ${type} \`** ${message}`;
            if (fetchChannel) {
                fetchChannel.send({ content: format_message })
            }
            console.log(format_message);
        } catch (error) {
            console.log(error.stack);
        }
    }
}

function formatDiscordTimestamp() {
    var nowTime = Math.floor(new Date().getTime() / 1000);
    return `<t:${nowTime}:t>`
}