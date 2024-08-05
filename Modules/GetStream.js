const
    fetch = require('node-fetch'),
    Logger = require('./Logger'),
    CheckToken = require('./CheckToken'),
    { twitch } = require('../config.json');

module.exports = {
    async getStream(userid) {
        const token = await CheckToken.fetchToken();
        try {
            if (!userid) return false;

            const url = `https://api.twitch.tv/helix/streams?user_id=${userid}`;
            const options = {
                method: 'GET',
                headers: {
                    'Client-Id': twitch.client_id,
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            };

            let retries = 4;

            for (let attempt = 1; attempt <= retries; attempt++) {
                try {
                    const response = await fetch(url, options);

                    if (response.ok) { // Checking for 2xx response status
                        console.log(response);
                        return await response.json();
                    } else {
                        const debug = await response.json();
                        console.error(`Fetch stream info request failed: ${response.status}, error: ${JSON.stringify(debug)}`);
                        if (attempt === retries) {
                            return { status: false, message: `Request failed after ${retries} attempts.` };
                        }
                    }
                } catch (error) {
                    console.error(`Fetch attempt ${attempt} failed: ${error.message}`);
                    if (attempt === retries) {
                        return { status: false, message: `All ${retries} attempts failed: ${error.message}` };
                    }
                }
            }
        } catch (error) {
            Logger.run('Error', error);
            return false;
        }
    }
}