const
    fetch = require('node-fetch'),
    { twitch } = require('../config.json');

module.exports = {
    async getUserid(username) {
        try {

            const url = `https://api.twitch.tv/helix/users?login=${username}`;
            const options = {
                method: 'GET',
                headers: {
                    'Client-Id': twitch.client_id,
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${twitch.token}`
                }
            };

            let retries = 4;

            for (let attempt = 1; attempt <= retries; attempt++) {
                try {
                    const response = await fetch(url, options);

                    if (response.ok) { // Checking for 2xx response status
                        const data = await response.json();
                        console.log(data);
                        return data.data[0]?.id ?? false; // Using optional chaining
                    } else {
                        const debug = await response.json();
                        console.error(`Fetch user info request failed: ${response.status}, error: ${JSON.stringify(debug)}`);
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
            console.log(error);
            return false;
        }
    }
}