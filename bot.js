const
    fs = require('fs'),
    TES = require('tesjs'),
    tmijs = require('tmi.js'),
    express = require("express"),
    CheckToken = require('./Modules/CheckToken'),
    { Client, GatewayIntentBits, Partials, Collection } = require('discord.js'),
    { twitch, discord, database, port } = require('./config.json'),
    Logger = require('./Modules/Logger')
;

/**
 * Node Express
 */
const app = express();
app.listen(port);

const tes = new TES({
    identity: {
        id: twitch.client_id,
        secret: twitch.client_secret
    },
    listener: {
        type: "webhook",
        baseURL: twitch.baseURL,
        secret: twitch.webhook_secret,
        server: app
    }
});

const tmi = new tmijs.client({
    identity: {
        username: twitch.username,
        password: twitch.password
    },
    channels: ['<YOUR-CHANNEL>'], // 變更 <YOUR-CHANNEL> 為您要發送的頻道，一定要填，不然沒加入聊天室沒辦法傳送訊息
});

tmi.connect();

/**
 * MySQL
 */
const mariadb = require('mariadb');
const pool = mariadb.createPool({
    host: database.host,
    user: database.user,
    password: database.password,
    database: database.table
});

/**
 * Discord Bot
 */
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [
        Partials.User,
        Partials.Channel,
        Partials.GuildMember,
        Partials.Message,
        Partials.Reaction
    ]
});

client.login(discord.token).then(async () => {
    checkSqlStatus();
    async function checkSqlStatus() {
        const conn = await pool.getConnection();
        try {
            conn.ping();
            console.log('Mysql: Connected.');
        } catch (error) {
            console.log('wtf?' + error);
        } finally {
            conn.release();
            console.log('Mysql: Released.');
        }
    }

    setInterval(() => {
        checkSqlStatus()
    }, 60000 * 10);

    await CheckToken.fetchToken();
});

global.client = client;
global.tes = tes;
global.tmi = tmi;
global.pool = pool;

const eventsub_files = fs.readdirSync('./EventSub').filter(file => file.endsWith('.js'))
for (const file of eventsub_files) {
    const event = require(`./EventSub/${file}`)
    tes.on(event.name, (...args) => {
        event.run(...args, {client, tes, pool})
    })
}

client.commands = new Collection();
const command_files = fs.readdirSync('./Commands').filter(file => file.endsWith('.command.js'));
for (const file of command_files) {
    const command = require(`./Commands/${file}`);
    client.commands.set(command.data.name, command);
}

const event_files = fs.readdirSync('./Events').filter(file => file.endsWith('.js'))
for (const file of event_files) {
    const event = require(`./Events/${file}`)
    client.on(event.name, (...args) => event.run(...args, {client, tes, pool}))
}

process.on('uncaughtException', (err, origin) => {
    Logger.run('Error', err)
    console.log(err.stack)
});