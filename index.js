const { Client } = require("discord.js");
const { DISCORD_TOKEN } = require("./config.json");
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

const prefix = "]GEORGE";

client.on("messageCreate", (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(prefix)) return;
  msg.reply("I am summoned\n" + msg.content.slice(prefix.length));
  console.log(msg.content);
});

client.login(DISCORD_TOKEN);
