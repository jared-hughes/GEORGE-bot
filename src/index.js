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

const LINES_LIMIT = 15;

const STOP_MESSAGES = {
  DONE: ":white_check_mark: Your eval job has successfully completed.",
  LENGTH:
    ":roll_of_paper: Your eval job was terminated early for too much output.",
  TIME: ":timer: Your eval job was terminated at 2 seconds of execution.",
};

function prettifyOutput(output, stopReason) {
  if (output === "") return "(empty)";
  lines = output.split("\n");
  if (lines.length > LINES_LIMIT) {
    const prefix = stopReason !== "DONE" ? "≥" : "";
    return (
      lines.slice(0, LINES_LIMIT).join("\n") +
      `\n... (truncated: ${prefix}${lines.length - LINES_LIMIT} more lines)`
    );
  }
  return output;
}

function run(code) {
  try {
    const int = runGEORGE(["-c", code], {
      stdout: false,
      outputToString: true,
      lengthLimit: 1024, // 1 kb, less than Discord's 2kb limit
      timeLimit: 2000, // 2s
    });
    const stdout = int.outputString;
    return (
      STOP_MESSAGES[int.stopReason] +
      codeBlock(prettifyOutput(stdout, int.stopReason))
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
