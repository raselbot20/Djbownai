const fs = require("fs-extra");
const nullAndUndefined = [undefined, null];

function getType(obj) {
  return Object.prototype.toString.call(obj).slice(8, -1);
}

function getRole(threadData, senderID) {
  const adminBot = global.GoatBot.config.adminBot || [];
  if (!senderID) return 0;
  const adminBox = threadData ? threadData.adminIDs || [] : [];
  return adminBot.includes(senderID)
    ? 2
    : adminBox.includes(senderID)
    ? 1
    : 0;
}

function getText(type, reason, time, targetID, lang) {
  const utils = global.utils;
  if (type == "userBanned")
    return utils.getText(
      { lang, head: "handlerEvents" },
      "userBanned",
      reason,
      time,
      targetID
    );
  else if (type == "threadBanned")
    return utils.getText(
      { lang, head: "handlerEvents" },
      "threadBanned",
      reason,
      time,
      targetID
    );
  else if (type == "onlyAdminBox")
    return utils.getText({ lang, head: "handlerEvents" }, "onlyAdminBox");
  else if (type == "onlyAdminBot")
    return utils.getText({ lang, head: "handlerEvents" }, "onlyAdminBot");
}

function replaceShortcutInLang(text, prefix, commandName) {
  return text
    .replace(/\{(?:p|prefix)\}/g, prefix)
    .replace(/\{(?:n|name)\}/g, commandName)
    .replace(/\{pn\}/g, `${prefix}${commandName}`);
}

function getRoleConfig(utils, command, isGroup, threadData, commandName) {
  let roleConfig;

  if (utils.isNumber(command.config.role)) {
    roleConfig = { onStart: command.config.role };
  } else if (
    typeof command.config.role == "object" &&
    !Array.isArray(command.config.role)
  ) {
    if (!command.config.role.onStart)
      command.config.role.onStart = 0;
    roleConfig = command.config.role;
  } else {
    roleConfig = { onStart: 0 };
  }

  if (isGroup)
    roleConfig.onStart =
      threadData.data.setRole?.[commandName] ?? roleConfig.onStart;

  for (const key of ["onChat", "onStart", "onReaction", "onReply"]) {
    if (roleConfig[key] == undefined)
      roleConfig[key] = roleConfig.onStart;
  }

  return roleConfig;
}

function isBannedOrOnlyAdmin(
  userData,
  threadData,
  senderID,
  threadID,
  isGroup,
  commandName,
  message,
  lang
) {
  const config = global.GoatBot.config;
  const { adminBot, hideNotiMessage } = config;

  const infoBannedUser = userData.banned;
  if (infoBannedUser.status == true) {
    const { reason, date } = infoBannedUser;
    if (hideNotiMessage.userBanned == false)
      message.reply(
        getText("userBanned", reason, date, senderID, lang)
      );
    return true;
  }

  if (
    config.adminOnly.enable == true &&
    !adminBot.includes(senderID) &&
    !config.adminOnly.ignoreCommand.includes(commandName)
  ) {
    if (hideNotiMessage.adminOnly == false)
      message.reply(getText("onlyAdminBot", null, null, null, lang));
    return true;
  }

  if (isGroup == true) {
    if (
      threadData.data.onlyAdminBox === true &&
      !threadData.adminIDs.includes(senderID) &&
      !(threadData.data.ignoreCommanToOnlyAdminBox || []).includes(
        commandName
      )
    ) {
      if (!threadData.data.hideNotiMessageOnlyAdminBox)
        message.reply(getText("onlyAdminBox", null, null, null, lang));
      return true;
    }

    const infoBannedThread = threadData.banned;
    if (infoBannedThread.status == true) {
      const { reason, date } = infoBannedThread;
      if (hideNotiMessage.threadBanned == false)
        message.reply(
          getText("threadBanned", reason, date, threadID, lang)
        );
      return true;
    }
  }
  return false;
}

module.exports = function (
  api,
  threadModel,
  userModel,
  dashBoardModel,
  globalModel,
  usersData,
  threadsData,
  dashBoardData,
  globalData
) {
  return async function (event, message) {
    const { utils, client, GoatBot } = global;
    const { getPrefix, removeHomeDir, log, getTime } = utils;
    const {
      config,
      configCommands: { envGlobal, envCommands, envEvents },
    } = GoatBot;
    const { autoRefreshThreadInfoFirstTime } = config.database;
    let { hideNotiMessage = {} } = config;

    const { body, messageID, threadID, isGroup } = event;

    if (!threadID) return;

    // 🔹 ======= FIXED MENTION HANDLING (IMPORTANT PART) ======= 🔹
    if (message?.mentions) event.mentions = message.mentions;
    if (!event.mentions) event.mentions = {};

    const senderID =
      event.senderID || event.userID || event.author || "";

    let threadData = global.db.allThreadData.find(
      (t) => t.threadID == threadID
    );
    let userData = global.db.allUserData.find(
      (u) => u.userID == senderID
    );

    if (!userData && !isNaN(senderID))
      userData = await usersData.create(senderID);

    if (!threadData && !isNaN(threadID)) {
      if (global.temp.createThreadDataError.includes(threadID))
        return;
      threadData = await threadsData.create(threadID);
      global.db.receivedTheFirstMessage[threadID] = true;
    } else {
      if (
        autoRefreshThreadInfoFirstTime === true &&
        !global.db.receivedTheFirstMessage[threadID]
      ) {
        global.db.receivedTheFirstMessage[threadID] = true;
        await threadsData.refreshInfo(threadID);
      }
    }

    if (typeof threadData.settings.hideNotiMessage == "object")
      hideNotiMessage = threadData.settings.hideNotiMessage;

    const prefix = getPrefix(threadID);
    const role = getRole(threadData, senderID);

    const parameters = {
      api,
      usersData,
      threadsData,
      message,
      event,
      userModel,
      threadModel,
      prefix,
      dashBoardModel,
      globalModel,
      dashBoardData,
      globalData,
      envCommands,
      envEvents,
      envGlobal,
      role,
    };

    const langCode =
      threadData.data.lang || config.language || "en";

    /* ===================== ON START (COMMAND) ===================== */
    async function onStart() {
      if (!body || !body.startsWith(prefix)) return;

      const dateNow = Date.now();
      const args = body
        .slice(prefix.length)
        .trim()
        .split(/ +/);

      let commandName = args.shift().toLowerCase();
      let command =
        GoatBot.commands.get(commandName) ||
        GoatBot.commands.get(
          GoatBot.aliases.get(commandName)
        );

      const aliasesData = threadData.data.aliases || {};
      for (const cmdName in aliasesData) {
        if (aliasesData[cmdName].includes(commandName)) {
          command = GoatBot.commands.get(cmdName);
          break;
        }
      }

      if (command) commandName = command.config.name;

      if (
        isBannedOrOnlyAdmin(
          userData,
          threadData,
          senderID,
          threadID,
          isGroup,
          commandName,
          message,
          langCode
        )
      )
        return;

      if (!command) {
        if (!hideNotiMessage.commandNotFound)
          return await message.reply(
            commandName
              ? utils.getText(
                  { lang: langCode, head: "handlerEvents" },
                  "commandNotFound",
                  commandName,
                  prefix
                )
              : utils.getText(
                  { lang: langCode, head: "handlerEvents" },
                  "commandNotFound2",
                  prefix
                )
          );
        else return true;
      }

      const roleConfig = getRoleConfig(
        utils,
        command,
        isGroup,
        threadData,
        commandName
      );
      const needRole = roleConfig.onStart;

      if (needRole > role) {
        if (!hideNotiMessage.needRoleToUseCmd) {
          if (needRole == 1)
            return await message.reply(
              utils.getText(
                { lang: langCode, head: "handlerEvents" },
                "onlyAdmin",
                commandName
              )
            );
          else if (needRole == 2)
            return await message.reply(
              utils.getText(
                { lang: langCode, head: "handlerEvents" },
                "onlyAdminBot2",
                commandName
              )
            );
        } else return true;
      }

      if (!client.countDown[commandName])
        client.countDown[commandName] = {};

      const timestamps = client.countDown[commandName];
      let getCoolDown = command.config.countDown;
      if (
        !getCoolDown &&
        getCoolDown != 0 ||
        isNaN(getCoolDown)
      )
        getCoolDown = 1;

      const cooldownCommand = getCoolDown * 1000;

      if (timestamps[senderID]) {
        const expirationTime =
          timestamps[senderID] + cooldownCommand;
        if (dateNow < expirationTime)
          return await message.reply(
            utils.getText(
              { lang: langCode, head: "handlerEvents" },
              "waitingForCommand",
              ((expirationTime - dateNow) / 1000)
                .toString()
                .slice(0, 3)
            )
          );
      }

      const time = getTime("DD/MM/YYYY HH:mm:ss");

      try {
        const getText2 = () => {};
        await command.onStart({
          ...parameters,
          args,
          commandName,
          getLang: getText2,
        });

        timestamps[senderID] = dateNow;
        log.info(
          "CALL COMMAND",
          `${commandName} | ${userData.name} | ${senderID} | ${threadID} | ${args.join(
            " "
          )}`
        );
      } catch (err) {
        log.err(
          "CALL COMMAND",
          `An error occurred when calling the command ${commandName}`,
          err
        );
      }
    }

    return {
      onStart,
    };
  };
};
