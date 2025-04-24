import * as core from "@actions/core";
import * as github from "@actions/github";
import sendMessage from "./sendMessage";
import { PullRequestEvent } from "@octokit/webhooks-definitions/schema";

async function run(): Promise<void> {
  try {
    const botToken = core.getInput("bot_token");
    const chatId = core.getInput("chat_id");

    if (github.context.eventName !== "pull_request") {
      throw new Error("This action only works on pull_request events");
    }

    const payload = github.context.payload as PullRequestEvent;

    if (!botToken || !chatId) {
      throw new Error("bot_token and chat_id are required");
    }

    const uri = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const message = formatMessage(payload);

    await sendMessage(chatId, message, uri);

    core.debug(`Message sent!`);
    core.setOutput("Finshed time", new Date().toTimeString());
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

// Format the message based on the event type, new pull or review request.
const formatMessage = (payload: PullRequestEvent): string => {
  const { action, pull_request, repository, sender, number } = payload;
  const { name, owner } = repository;
  const { title } = pull_request;
  let message = "";
  const prTitle = escapeMarkdown(title);
  const ownerName = escapeMarkdown(owner.login);
  const repoName = escapeMarkdown(name);
  const senderName = escapeMarkdown(sender.login);

  switch (action) {
    case "opened":
      message = `🔄 *PR* \\\#${number}
      레포지토리 [${ownerName}/${repoName}](https://github.com/${ownerName}/${repoName}/pull/${number})
      *제목:* ${prTitle}
      *요청자:* [${senderName}](https://github.com/${senderName})
      [PR 보기](https://github.com/${ownerName}/${repoName}/pull/${number})
      `;
      console.debug("Message: ", message);
      return message;
    default:
      throw new Error(`Unsupported action: ${action}`);
  }
};

/*Escape markdown characters based on
  https://core.telegram.org/bots/api#markdownv2-style
  ignore pre and code entities as we do not use.
*/
const escapeMarkdown = (text: string): string => {
  return text.replace(/([_*\[\]()~`>#+-=|{}\.!])/g, "\\$1");
};

run();
