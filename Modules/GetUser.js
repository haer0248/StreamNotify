const
    fetch = require('node-fetch'),
    Logger = require('./Logger'),
    { twitch } = require('../config.json');

module.exports = {
    async getUser(userid) {
        try {
            if (!userid) return false;

            const response = await fetch(`https://api.twitch.tv/helix/users?id=${userid}`, {
                method: 'GET',
                headers: {
                    'Client-Id': `${twitch.client_id}`,
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${twitch.token}`
                }
            });

            return response.json();
        } catch (error) {
            Logger.run('Error', error.stack);
            return false;
        }
    }
}