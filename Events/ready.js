const
    path = require('path'),
    logger = require('../Modules/Logger')

const event = path.parse(__filename).name;

module.exports = {
    name: event,
    async run (bot, { client }) {
        client.user.setActivity({
            name: 'nekolive.net'
        });

        setInterval(() => {
            client.user.setActivity({ name: 'nekolive.net' });
        }, 60000 * 10);

        logger.run('Bot', 'Start', client);
    }
}