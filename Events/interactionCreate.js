const
    { InteractionType } = require('discord.js'),
    path = require('path')
;

const event = path.parse(__filename).name;

module.exports = {
    name: event,
    async run (interaction, { client }) {

        /* 根據不同 interaction 進不同的 code */
        if (interaction.isStringSelectMenu()) {

            const select = client.selects.get(interaction.customId);

            try {
                await select.execute(interaction, client);
            } catch (error) {
                await interaction.editReply({ content: `執行斜線指令時出現問題！` });
            }

        } else if (interaction.isContextMenuCommand()) {

            const context = client.contexts.get(interaction.commandName);
            await interaction.deferReply({ ephemeral: true });

            try {
                await context.execute(interaction, client);
            } catch (error) {
                await interaction.editReply({ content: `執行斜線指令時出現問題！`});
            }

        } else if (interaction.isChatInputCommand()) {

            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            await interaction.deferReply();

            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.log(error);
                await interaction.editReply({ content: `執行斜線指令時出現問題！`});
            }

        } else if (interaction.type === InteractionType.ModalSubmit) {

            const form = client.forms.get(interaction.customId)
            try {
                await form.execute(interaction, client);
            } catch (error) {
                await interaction.editReply({ content: `送出表單時出現問題！`});
            }

        } else if (interaction.isButton()) {

            const buttonId = interaction.customId.split('-')[0]
            const button = client.buttons.get(buttonId)
            if (!button) return

            try {
                await button.execute(interaction, client);
            } catch (error) {
                await interaction.editReply({ content: `按鈕送出時出現問題！`});
            }

        }
        return;
    }
}