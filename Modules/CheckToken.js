const
    fs = require('fs'),
    fetch = require('node-fetch'),
    path = require('path'),
    Logger = require('./Logger'),
    { twitch } = require('../config.json');

var filePath, botdata, botjson;

filePath = path.join(__dirname, '../config.json');
botdata = fs.readFileSync(filePath);
botjson = JSON.parse(botdata);

var err = 0;

/**
 * 檢查 token 過期及更新
 */
const fetchToken = async () => {
    if (err >= 5) {
        Logger.run('Token', 'Error get token. Please check your client-id and client-secret');
        process.exit();
        return;
    }
    Logger.run('Token', 'Checking app token status...');
    try {
        const response = await fetch(`https://id.twitch.tv/oauth2/validate`, {
            method: 'GET',
            headers: {
                'Client-Id': `${twitch.client_id}`,
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${twitch.token}`
            }
        });

        if (response.status === 401) return await updateToken()
        Logger.run('Token', 'App token valid.');
        return twitch.token;
    } catch (error) {
        return await updateToken()
    }
}

const updateToken = async () => {
    Logger.run('Token', 'App token expired, updating ...');

    try {
        const response = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${twitch.client_id}&client_secret=${twitch.client_secret}&grant_type=client_credentials`, {
            method: 'POST'
        });

        fetch_data = await response.json()
        botjson.twitch.token = fetch_data.access_token;
        fs.writeFileSync(filePath, JSON.stringify(botjson, null, 2));
        
        if (response.status === 200) {
            err = 0;
            Logger.run('Token', `Update app token successfully.`);
            return fetch_data.access_token;
        } else {
            err += 1;
            Logger.run('Token', 'Update app token failed.' + JSON.stringify(response));
            return await updateToken();
        }
    } catch (error) {
        err += 1;
        Logger.run('Token', `Update app token failed: ${error}.`);
    }
}

module.exports = {
    fetchToken
}