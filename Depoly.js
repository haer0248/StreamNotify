const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { discord } = require('./config.json');
const fs = require('node:fs');

const commands = [];
const commandFiles = fs.readdirSync('./Commands').filter(file => file.endsWith('.command.js'));

for (const file of commandFiles) {
	const command = require(`./Commands/${file}`);
	console.log(`已讀取 ${file}`);
	try {
		commands.push(command.data.toJSON());
	} catch (error) {
		console.log(error)
	}
}

const contextFiles = fs.readdirSync('./Commands').filter(file => file.endsWith('.context.js'));

for (const file of contextFiles) {
	const context = require(`./Commands/${file}`);
	console.log(`APP 指令已讀取：${file}`)
	commands.push(context.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(discord.token);

(async () => {
	try {
		console.log('正在重新讀取斜線指令 ...');

		await rest.put(
			Routes.applicationCommands(discord.client_id),
			{ body: commands },
		);

		console.log('已成功重新註冊斜線指令。');
	} catch (error) {
		console.error(error);
	}
})();
