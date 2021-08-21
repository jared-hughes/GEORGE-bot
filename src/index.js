const { Client } = require("discord.js");
const { DISCORD_TOKEN } = require("./config.json");
const client = new Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });
const runGEORGE = require("../GEORGE/dist/runGEORGE.js").default;

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

const prefix = /^GEORGE\s/;
const inlineCodeRegex = /(?<delim>``?)\n*(?<code>(.|\n)*?)\n*\k<delim>/;
const blockCodeRegex = /```([a-z]+\n)?\n*(?<code>(.|\n)*?)\n*```/i;

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
  evalHistory.push(Date.now());
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

EVAL_PER_MINUTE_LIMIT = 15;
evalHistory = [];
MINUTE = 60000;

function getMessageCode(msg) {
  if (msg.author.bot) return null;
  const prefixMatch = prefix.exec(msg);
  if (prefixMatch === null) return null;
  content = msg.content.slice(prefixMatch[0].length);
  const match = codeMatch(content);
  return match?.groups.code;
}

function shouldAcceptMessage(now) {
  while (evalHistory.length && evalHistory[0] < now - MINUTE) {
    evalHistory.shift();
  }
  return evalHistory.length < EVAL_PER_MINUTE_LIMIT;
}

function evalMessageCode(code) {
  console.log("c", code);
  const now = Date.now();
  if (!shouldAcceptMessage(now)) {
    const wait = (60 - (now - evalHistory[0]) / 1000).toFixed(0);
    return `Too many eval requests in the past minute. Please wait ${wait} seconds.`;
  }
  return run(code);
}

let messageMap = {};

client.on("messageCreate", async (msg) => {
  const code = getMessageCode(msg);
  if (code !== null) {
    const res = evalMessageCode(code);
    const newMessage = await msg.reply(res);
    messageMap[msg.id] = newMessage;
  }
});

client.on("messageUpdate", (oldMessage, newMessage) => {
  const code = getMessageCode(newMessage);
  if (code !== null) {
    const res = evalMessageCode(code);
    const oldMessageReply = messageMap[oldMessage.id];
    if (oldMessageReply !== undefined) {
      oldMessageReply.edit(res);
    } else {
      newMessage.reply(res);
    }
  }
});

client.on("messageDelete", (message) => {
  const oldMessageReply = messageMap[message.id];
  if (oldMessageReply !== undefined) {
    oldMessageReply.delete();
  }
});

client.login(DISCORD_TOKEN);
