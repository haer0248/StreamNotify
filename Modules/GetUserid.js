const
    fetch = require('node-fetch'),
    Logger = require('./Logger'),
    { twitch } = require('../config.json');

module.exports = {
    async getUserid(username) {
        try {
            const response = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
                method: 'GET',
                headers: {
                    'Client-Id': `${twitch.client_id}`,
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${twitch.token}`
                }
            });

            data = await response.json();
            return (data.data[0].id ?? false);
        } catch (error) {
            Logger.run('Error', error.stack);
            return false;
        }
    }
}