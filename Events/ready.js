const
    path = require('path'),
    Logger = require('../Modules/Logger')

const event = path.parse(__filename).name;

module.exports = {
    name: event,
    async run (bot, { client }) {
        client.user.setActivity({
            name: 'Stream Notfiy - nekolive.net'
        });

        setInterval(() => {
            client.user.setActivity({ name: 'Stream Notfiy - nekolive.net' });
        }, 60000 * 10);

        Logger.run('Bot', 'Start', client);
    }
}