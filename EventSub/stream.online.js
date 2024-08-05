const
    path = require('path'),
    Logger = require('../Modules/Logger'),
    { getUser } = require('../Modules/GetUser'),
    { getStream } = require('../Modules/GetStream');

const event = path.parse(__filename).name;
const streamCooldown = new Set();

module.exports = {
    name: event,
    async run(event, subscription) {
        const conn = await pool.getConnection();
        const broadcaster_user_id = event.broadcaster_user_id;
        const broadcaster_user_login = event.broadcaster_user_login;
        const broadcaster_user_name = event.broadcaster_user_name;

        const [result, flied] = await conn.query(`SELECT * FROM stream_notify WHERE userid = ?`, [broadcaster_user_id]);
        var template;

        Logger.run('Notify', `✅ Receive stream in live from \`${broadcaster_user_name} (${broadcaster_user_login})\`.`);

        try {
            try {
                await conn.query('UPDATE stream_notify SET username = ?, login_id = ?, last_live = now() WHERE userid = ?', [broadcaster_user_name, broadcaster_user_login, broadcaster_user_id]);
            } catch (error) {
                console.log(error.stack);
                Logger.run('Notify', `❌ Update database failed: ${error} \`${broadcaster_user_name} (${broadcaster_user_login})\``);
            } finally {
                conn.end();
            }

            if (!streamCooldown.has(broadcaster_user_id)) {
                if (event.type == "live") {
                    try {
                        if (result?.send) {
                            template = (result?.message ?? `MrDestructoid 開台偵測器偵測到{username}開台了！傳送門 → {url}`);
                            let message = template;
                            message = message.replaceAll('{username}', broadcaster_user_name);
                            message = message.replaceAll('{account}', broadcaster_user_login);
                            message = message.replaceAll('{url}', `https://twitch.tv/${broadcaster_user_login}`);
                            tmi.action(`#<YOUR-CHANNEL>`, message);
                            Logger.run('Notify', `➡️ Sent chatroom notify \`${broadcaster_user_name} (${broadcaster_user_login})\` successfully.`);
                        }
                    } catch (error) {
                        console.log(error.stack);
                        Logger.run('Notify', `➡️ Send boardcast failed: ${error.message} \`${broadcaster_user_name} (${broadcaster_user_login})\`.`);
                    }

                    try {
                        if (result?.discord) {
                            const webhook = result?.webhook;
                            const message = result?.message;

                            let display_content = '';

                            if (message) {
                                display_content += `${message}`
                            }
                            display_content = display_content.replaceAll(`_`, `\_`);
                            display_content = display_content.replaceAll(`|`, `\|`);

                            if (webhook) {
                                const userData = await getUser(broadcaster_user_id);
                                const streamData = await getStream(broadcaster_user_id);

                                const user = userData.data[0];
                                const stream = streamData.data[0];

                                const currentDate = new Date();
                                const timestamp = currentDate.getTime();

                                var image = stream?.thumbnail_url;
                                if (!stream?.thumbnail_url) {
                                    image = user?.offline_image_url;
                                } else {
                                    image = image.replace('{width}', '1920');
                                    image = image.replace('{height}', '1080');
                                }
                                image = image + '?timestamp=' + timestamp;

                                var game_name = stream?.game_name;
                                if (!game_name) {
                                    Logger.run('Notify', `❌ Boardcast cancel, category not setup \`${broadcaster_user_name} (${broadcaster_user_login})\`.`);
                                    return;
                                }

                                var title = stream?.title;
                                if (title !== undefined || title !== null) {
                                    title = stream.title;
                                } else {
                                    title = `${broadcaster_user_name} 正在直播！`;
                                }
                                title = title.replaceAll(`_`, `\_`);
                                title = title.replaceAll(`|`, `\|`);

                                display_title = title;
                                display_image = image;

                                const payload = {
                                    username: '直播通知',
                                    avatar_url: 'https://image.haer0248.me/avatar/4xDPRg.png',
                                    components: [{
                                        type: 1,
                                        components: [{
                                            type: 2,
                                            style: 5,
                                            label: '觀看直播',
                                            url: `https://twitch.tv/${broadcaster_user_login}`
                                        }]

                                    }],
                                    embeds: [{
                                        author: {
                                            name: `🔴 ${stream.user_name} 正在遊玩 ${game_name}！`,
                                            url: `https://twitch.tv/${broadcaster_user_login}`,
                                            icon_url: user.profile_image_url
                                        },
                                        title: display_title,
                                        url: `https://twitch.tv/${broadcaster_user_login}`,
                                        image: {
                                            url: display_image
                                        }
                                    }],
                                    timestamp: timestamp
                                }
                                
                                const response = await fetch(webhook, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(payload)
                                });

                                if (response.ok) {
                                    Logger.run('Notify', `➡️ Sent boardcast \`${broadcaster_user_name} (${broadcaster_user_login})\`.`);
                                } else {
                                    Logger.run('Notify', `➡️ Sent boardcast failed: Error code: ${response.status}. \`${broadcaster_user_name} (${broadcaster_user_login})\`.`);
                                }
                            } else {
                                Logger.run('Notify', `➡️ Sent boardcast failed: User not set webhook url. \`${broadcaster_user_name} (${broadcaster_user_login})\``);
                            }
                        }
                    } catch (error) {
                        console.log(error.stack);
                        Logger.run('Notify', `➡️ Send boardcast failed: ${error} \`${broadcaster_user_name} (${broadcaster_user_login})\`.`);
                    }
                    setStreamCooldown(broadcaster_user_id)
                }
            } else {
                Logger.run('Notify', `❌ User in cooldown. \`${broadcaster_user_name} (${broadcaster_user_login})\``);
            }
        } catch (error) {
            console.log(error.stack);
            Logger.run('Notify', `➡️ Send boardcast failed: ${error.message} \`${broadcaster_user_name} (${broadcaster_user_login})\`.`);
        } finally {
            Logger.run('Notify', `🟩 Send boardcast action done. \`${broadcaster_user_name} (${broadcaster_user_login})\``);
        }
    }
}

function setStreamCooldown(broadcaster_user_id, cdTime = 1800 * 1000) {
    streamCooldown.add(broadcaster_user_id);
    setTimeout(() => { streamCooldown.delete(broadcaster_user_id); }, cdTime);
}