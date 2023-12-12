const
    path = require('path'),
    Logger = require('../Modules/Logger');

const event = path.parse(__filename).name;

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
            await conn.query('UPDATE stream_notify SET username = ?, login_id = ? WHERE userid = ?', [username, userlogin, userid]);
        } catch (error) {
            console.log(error.stack);
            Logger.run('Notify', `Update database failed: ${error}).`);
        } finally {
            conn.end();
        }

        try {
            if (result?.send) {
                if (event.type == "live") {
                    template = (result?.message ?? `MrDestructoid 開台偵測器偵測到{username}開台了！傳送門 → {url}`); // 如果沒有自定訊息就跑預設訊息
                    Logger.run('Notify', `---> Sent notify \`${username}\`(\`${userid}\`) successfully.`);
                    let message = template;
                        message = message.replaceAll('{username}', username); // 覆蓋為使用者名稱
                        message = message.replaceAll('{account}', userlogin); // 覆蓋為登入帳號
                        message = message.replaceAll('{url}', `https://twitch.tv/${userlogin}`); // 覆蓋為圖奇網址

                    tmi.action('#<YOUR-CHANNEL>', message); // 變更 <YOUR-CHANNEL> 為您要發送的頻道
                    return;
                }
            }
        } catch (error) {
            console.log(error.stack);
            Logger.run('Notify', `Send boardcast failed: ${error}.`);
        }
    }
}