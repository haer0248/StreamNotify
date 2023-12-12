# StreamNotify

所需環境：  
Nodejs Mysql

所需資料：  
Twitch Developer Application
Discord Developer / Discord Bot

# 使用步驟
1. 建立資料表
```sql
CREATE TABLE `stream_notify` (
  `No` int NOT NULL,
  `login_id` varchar(32) NOT NULL,
  `userid` varchar(16) NOT NULL,
  `username` varchar(32) DEFAULT NULL,
  `uuid` varchar(36) DEFAULT NULL,
  `last_live` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `send` int NOT NULL DEFAULT '1',
  `message` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
ALTER TABLE `stream_notify`
  ADD PRIMARY KEY (`No`);
ALTER TABLE `stream_notify`
  MODIFY `No` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;
COMMIT;
```

2. 修改 `config-sample.json`，修改完畢後重新命名為 `config.json`
* 所有欄位 (除 Twitch Token) 皆必填
```
port = 程式所使用的端口

// Twitch 開發者資訊
// https://dev.twitch.tv/console
twitch.baseURL = Twitch Webhook 回呼網址
twitch.client_id = Twitch 用戶端 ID
twitch.client_secret = Twitch 用戶端密鑰
twitch.webhook_secret = Webhook 回呼密鑰
twitch.token = Twitch Token (程式會自動取得，可以不用自己拿)

// Twitch 聊天室登入
// OAuth 密碼使用 https://twitchapps.com/tmi/ 來取得
twitch.username = 帳號
twitch.password = OAuth 密碼

// Discord 機器人
// 開發者頁面 https://discord.com/developers
// 建立機器人教學 https://haer0248.me/143/
discord.token = Discord 機器人 Token
discord.client_id = Discord 用戶端 ID
discord.client_secret = Discord 用戶端密鑰
discord.guild = 自己的群組 ID
discord.log = 紀錄頻道 ID
discord.ownerid = 你自己的使用者 ID

database.host = 資料庫位置
database.user = 資料庫使用者
database.password = 使用者密碼
database.table = 資料庫
```

3. Node 安裝所需套件
```
npm install discord.js tesjs tmi.js express mariadb node-fetch@2
```

4. 確認填寫完畢後，使用 `node Depoly.js` 部屬斜線指令

5. 變更 `bot.js` 與 `EventSub/stream.online.js` 中的 `<YOUR-CHANNEL>`
變更為您自己的 Twitch 聊天室或是要發送的聊天室

6. 部屬完畢後，使用 `npm start` 啟動機器人