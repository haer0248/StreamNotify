const
    path = require('path'),
    Logger = require('../Modules/Logger')
;

const event = path.parse(__filename).name;

module.exports = {
    name: event,
    async run(event, subscription) {
        const conn = await pool.getConnection();
        try {
            await conn.query('DELETE FROM stream_notify WHERE uuid = ?', [subscription.id]);
            Logger.run('Notify', `Receive remove request from Twitch: \`${result.data[0].id}\`.`);
        } catch (error) {
            console.log(error);
            Logger.run('Notify', `The sql command return error: ${error}`);
        } finally {
            // conn.release();
            conn.end();
        }        

        return;
    }
}