const { Client } = require("discord.js");
const { DISCORD_TOKEN } = require("./config.json");
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });
const runGEORGE = require("../GEORGE/dist/runGEORGE.js").default;

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

const prefix = /^GEORGE\s/;
const inlineCodeRegex = /(?<delim>``?)\n*(?<code>.*?)\n*\k<delim>/m;
const blockCodeRegex = /```([a-z]+\n)?\n*(?<code>.*?)\n*```/im;

function codeMatch(msg) {
  const blockMatch = blockCodeRegex.exec(msg);
  if (blockMatch !== null) {
    return blockMatch;
  } else {
    return inlineCodeRegex.exec(msg);
  }
}

function codeBlock(text) {
  return "```\n" + text + "\n```\n";
}

function run(code) {
  // TODO: add time limit (prevent infinite loop)
  // TODO: try-catch
  // TODO: truncate messages with a ton of lines
  try {
    const result = runGEORGE(["-c", code], {
      stdout: false,
      outputToString: true,
      limitLength: 1024, // 1 kb, less than Discord's 2kb limit
    });
    return (
      ":white_check_mark: Your eval job has successfully completed." +
      codeBlock(result || "(empty)")
    );
  } catch (e) {
    return ":x: Your eval job has failed. Debug output:\n" + codeBlock(e);
  }
}

client.on("messageCreate", (msg) => {
  if (msg.author.bot) return;
  const prefixMatch = prefix.exec(msg);
  if (prefixMatch === null) return;

  content = msg.content.slice(prefixMatch[0].length);
  const match = codeMatch(content);
  if (match !== null) {
    // no args rn
    // const args = msg.content.slice(0, match.index);
    const code = match.groups.code;
    const res = run(code);
    console.log("code", code);
    console.log("response", res);
    msg.reply(res);
  } else {
    console.log("no match for content", content);
  }
});

client.login(DISCORD_TOKEN);
