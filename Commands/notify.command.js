const
    { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, codeBlock } = require('discord.js'),
    { getUserid } = require('../Modules/GetUserid'),
    { getChannel } = require('../Modules/GetChannel'),
    { getUser } = require('../Modules/GetUser')
    ;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('notify')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDescription('Add channel stream notify.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a channel when live notify.')
                .addStringOption(option =>
                    option
                        .setName('account')
                        .setDescription('Twitch username')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('webhook_url')
                        .setDescription('Send channel live notify webhook url')
                        .setRequired(true)
                ),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('check')
                .setDescription('Check a channel')
                .addStringOption(option =>
                    option
                        .setName('account')
                        .setDescription('Twitch username')
                        .setRequired(true)
                ),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit a channel')
                .addStringOption(option =>
                    option
                        .setName('account')
                        .setDescription('Twitch username')
                        .setRequired(true)
                )
                .addBooleanOption(option =>
                    option
                        .setName('send')
                        .setDescription('Send channel notify true or false.')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('webhook_url')
                        .setDescription('Send channel live notify webhook url')
                        .setRequired(true)
                )
                .addBooleanOption(option =>
                    option
                        .setName('send_discord')
                        .setDescription('Send discord channel notify true or false.')
                )
                .addStringOption(option =>
                    option
                        .setName('message')
                        .setDescription('When live send message (use {username} and {account} replace)')
                ),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all created channels.'),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove live channel notify.')
                .addStringOption(option =>
                    option
                        .setName('account')
                        .setDescription('Twitch username')
                        .setRequired(true)
                )
        ),
    async execute(interaction, client) {
        if (!discord.ownerid) return interaction.editReply({ content: '設定錯誤，無法使用，請閱讀 README.md。'});

        if (interaction.user.id !== discord.ownerid) {
            return interaction.editReply({ content: '別亂戳。' });
        }

        const conn = await pool.getConnection();
        const username = interaction.options.getString('account');
        const userid = await getUserid(username);
        const event = 'stream.online';

        var embed = new EmbedBuilder(), subs;

        switch (interaction.options.getSubcommand()) {
            case 'check':
                try {
                    const [result, flied] = await conn.query(`SELECT * FROM stream_notify WHERE login_id = ?`, [username]);

                    if (!result?.userid) {
                        embed.setTitle(`❌ User Not Found`).setColor(0xff0000).setDescription(codeBlock(`Channel ${username} has not been created yet.`));
                    } else {
                        const userData = await getUser(result.userid);
                        const channelData = await getChannel(result.userid);

                        const user = userData?.data[0];
                        const channel = channelData?.data[0];

                        embed.setTitle(`✅ Channel Result`).setColor(0x00ff00)
                            .setURL(`https://twitch.tv/${channel.broadcaster_login}`)

                        if (user?.profile_image_url) {
                            embed.setAuthor({
                                name: result.username,
                                iconURL: user.profile_image_url,
                                url: `https://twitch.tv/${result.login_id}`
                            })
                        }

                        var pv_message = `MrDestructoid 開台偵測器偵測到{username}開台了！傳送門 → {url}`;
                        if (result?.message) {
                            pv_message = result.message;
                        }
                        pv_message = pv_message.replaceAll('{username}', result.username);
                        pv_message = pv_message.replaceAll('{account}', result.login_id);
                        pv_message = pv_message.replaceAll('{url}', `https://twitch.tv/${result.login_id}`);

                        embed.addFields({
                            name: "Channel Description",
                            value: codeBlock(user.description ?? 'Unset.'),
                        }, {
                            name: "User ID",
                            value: codeBlock(result.userid),
                            inline: true
                        }, {
                            name: "User Name",
                            value: codeBlock(result.username),
                            inline: true
                        }, {
                            name: "Live Notify",
                            value: codeBlock(result.send ? `✅ True` : `❌ False`),
                            inline: true
                        }, {
                            name: "Live Notify (Discord)",
                            value: codeBlock(result.discord ? `✅ True` : `❌ False`),
                            inline: true
                        }, {
                            name: "Sub UUID",
                            value: codeBlock(result.uuid),
                        }, {
                            name: "Live Message",
                            value: codeBlock((result?.message ?? 'Default.')),
                        }, {
                            name: "Live Message (Preview)",
                            value: codeBlock(pv_message ?? 'MrDestructoid 開台偵測器偵測到{username}開台了！傳送門 → {url}'),
                        }, {
                            name: "Last live",
                            value: (result.last_live ? `<t:${(Date.parse(result.last_live) / 1000)}>` : 'No data')
                        })
                    }
                } catch (error) {
                    console.log(error);
                } finally {
                    conn.end();
                }
                break;
            case 'list':
                try {
                    let rs = "";
                    const result = await conn.query(`SELECT * FROM stream_notify`);
                    subs = await tes.getSubscriptions();
                    result.forEach(element => {
                        rs += (element['username'] ? `${element['username']}(${element['login_id']})` : element['login_id']) + ', ';
                    });
                    rs = rs.slice(0, -2);
                    embed.setTitle(`📜 Notify List (${subs.total}/10,000):`).setDescription(codeBlock(rs)).setColor(0x00ff00);
                } catch (error) {
                    console.log(error);
                }
                break;
            case 'create':
                if (!userid) {
                    embed.setTitle(`❌ User not found`).setColor(0xff0000).setDescription(`Server response: ${codeBlock(userid)}`);
                } else {
                    try {
                        var webhook = interaction.options.getString('webhook_url');

                        var version = 1;
                        var condition = {
                            broadcaster_user_id: userid
                        };

                        const [result, flied] = await conn.query("SELECT * FROM stream_notify WHERE login_id = ?", [username]);
                        if (result?.uuid) {
                            embed.setTitle(`The channel \`${username}\` has been established, uuid is \`${result?.uuid}\`.`).setColor(0xff0000);
                        } else {
                            const sub = await tes.subscribe(event, condition, version);
                            var res = sub;
                            subs = await tes.getSubscriptions();
                            try {
                                await conn.query('INSERT INTO stream_notify (login_id, userid, uuid) VALUES (?, ?, ?)', [username, userid, res.data[0].id]);
                                const users = await getUser(userid);
                                const user = users?.data[0];
                                embed.setTitle(`✅ Created Success`).setColor(0x00ff00).setDescription(codeBlock(`Create stream live notfiy for channel ${user?.display_name}(${user?.login}) success, api limit (${subs.total}/10,000).`));
                            } catch (error) {
                                embed.setTitle('❌ Server Error').setDescription(codeBlock(error.stack)).setColor(0xff0000);
                            }
                        }
                    } catch (error) {
                        console.log(error);
                        embed.setTitle('❌ Server Error').setDescription(codeBlock(error.stack)).setColor(0xff0000);
                    } finally {
                        conn.end();
                    }
                }
                break;
            case 'edit':
                const send = interaction.options.getBoolean('send');
                const send_discord = interaction.options.getBoolean('send_discord');
                if (!userid) {
                    embed.setTitle(`❌ User not found`).setColor(0xff0000).setDescription(`Server response: ${codeBlock(userid)}`);
                } else {
                    try {
                        var message = interaction.options.getString('message');
                        var webhook = interaction.options.getString('webhook_url');

                        var setMessage = '';

                        var version = 1;
                        var condition = {
                            broadcaster_user_id: userid
                        };

                        if (send_discord) {
                            setMessage += `, set discord channel: ${send_discord}`;
                        }

                        const [result, flied] = await conn.query("SELECT * FROM stream_notify WHERE login_id = ?", [username]);
                        if (!result?.uuid) {
                            embed.setTitle(`❌ Channel \`${username}\` has not been created yet.`).setColor(0xff0000);
                        } else {
                            try {
                                await conn.query('UPDATE stream_notify SET send = ?, discord = ? WHERE userid = ?', [send, send_discord, userid]);
                                if (message) {
                                    let pv_message = message;
                                    pv_message = pv_message.replaceAll('{username}', (result?.username ?? result?.login_id));
                                    pv_message = pv_message.replaceAll('{account}', result.login_id);
                                    pv_message = pv_message.replaceAll('{url}', `https://twitch.tv/${result.login_id}`);
                                    await conn.query('UPDATE stream_notify SET message = ? WHERE userid = ?', [message, userid]);
                                    setMessage += `, set message: ${message}, preview: ${pv_message}`;
                                }
                                if (webhook) {
                                    await conn.query('UPDATE stream_notify SET webhook = ? WHERE userid = ?', [webhook, userid]);
                                    setMessage += `, webhook url set: ${webhook}`;
                                }
                                embed.setTitle(`✅ Edit Success`).setColor(0x00ff00).setDescription(codeBlock(`Set stream notify for channel ${(result?.username ?? result?.login_id)} (${result?.login_id}) success, now channel setting is ${send}${setMessage}.`));
                            } catch (error) {
                                embed.setTitle('❌ Server Error').setDescription(codeBlock(error.stack)).setColor(0xff0000);
                            }
                        }
                    } catch (error) {
                        console.log(error);
                        embed.setTitle('❌ Server Error').setDescription(codeBlock(error.stack)).setColor(0xff0000);
                    } finally {
                        conn.end();
                    }
                }
                break;
            case 'remove':
                if (!userid) {
                    embed.setTitle(`❌ User not found`).setColor(0xff0000).setDescription(`Server response: ${codeBlock(userid)}`);
                } else {
                    try {
                        var version = 1;
                        var condition = {
                            broadcaster_user_id: userid
                        };

                        await tes.unsubscribe(event, condition);
                        subs = await tes.getSubscriptions();

                        try {
                            await conn.query('DELETE FROM `stream_notify` WHERE userid = ?', [userid]);
                            embed.setTitle(`✅ Successfully remove channel \`${username}\`(\`${userid}\`), limit (${subs.total}/10,000).`).setColor(0x00ff00);
                        } catch (error) {
                            embed.setTitle('❌ Server Error').setDescription(codeBlock(error.stack)).setColor(0xff0000);
                        }
                    } catch (error) {
                        console.log(error);
                        embed.setTitle('❌ Server Error').setDescription(codeBlock(error.stack)).setColor(0xff0000);
                    } finally {
                        conn.end();
                    }
                }
                break;
            default:
                embed.setTitle('⚠️⚠️⚠️ THIS IS FUCKING BUG, FIX IT ASAP ⚠️⚠️⚠️').setColor(0x00ff00);
                break;
        };

        return interaction.editReply({ embeds: [embed] })
    }
}