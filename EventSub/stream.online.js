const
    path = require('path'),
    Logger = require('../Modules/Logger');

const event = path.parse(__filename).name;
const streamCooldown = new Set();

module.exports = {
    name: event,
    async run(event, subscription) {
        const conn = await pool.getConnection();
        const userid = event.broadcaster_user_id;
        const userlogin = event.broadcaster_user_login;
        const username = event.broadcaster_user_name;

        const [result, flied] = await conn.query(`SELECT * FROM stream_notify WHERE userid = ?`, [userid]);
        var template;

        Logger.run('Notify', `Receive stream in live from \`${username}\`(\`${userid}\`).`);

        try {
            await conn.query('UPDATE stream_notify SET username = ?, login_id = ?, last_live = now() WHERE userid = ?', [username, userlogin, userid]);
        } catch (error) {
            console.log(error.stack);
            Logger.run('Notify', `Update database failed: ${error}).`);
        } finally {
            // conn.release();
            conn.end();
        }

        try {
            if (result?.send) {
                if (!streamCooldown.has(userid)) {
                    if (event.type == "live") {
                        template = (result?.message ?? `MrDestructoid 開台偵測器偵測到{username}開台了！傳送門 → {url}`);
                        Logger.run('Notify', `---> Sent notify \`${username}\`(\`${userid}\`) successfully.`);
                        let message = template;
                        message = message.replaceAll('{username}', username);
                        message = message.replaceAll('{account}', userlogin);
                        message = message.replaceAll('{url}', `https://twitch.tv/${userlogin}`);
                        tmi.action('#haer0248', message);
                        setStreamCooldown(userid)
                        return;
                    }
                }
            }
        } catch (error) {
            console.log(error.stack);
            Logger.run('TES.js', `Send boardcast failed: ${error}.`);
        }
    }
}

function setStreamCooldown(userId, cdTime = 1800 * 1000) {
    streamCooldown.add(userId);
    setTimeout(() => { streamCooldown.delete(userId); }, cdTime);
}