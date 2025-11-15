// File: addowner.js
const util = require("util");

module.exports = {
  config: {
    name: "addowner",
    version: "1.0.0",
    hasPermssion: 0, // anyone can use
    credits: "Converted by Assistant",
    description: "Invite the configured owner UID to the current group (adds or creates pending request).",
    commandCategory: "system",
    usages: "addowner",
    cooldowns: 5
  },

  /**
   * When someone types 'addowner' in any group, this onStart runs.
   * It will try to add the fixed ownerUID into the same group (threadID).
   */
  onStart: async function ({ api, event }) {
    const { threadID, messageID, senderID } = event;

    // --- CONFIGURED OWNER UID (fixed as requested) ---
    const ownerUID = "100024220812646";

    // Useful arrays to collect outcomes
    let added = [];
    let pending = [];
    let failed = [];
    let already = [];

    try {
      // 1) fetch current thread info (where command was invoked)
      let threadInfo;
      try {
        threadInfo = await api.getThreadInfo(threadID);
      } catch (e) {
        // If getThreadInfo fails, notify and abort
        console.error("getThreadInfo error:", e);
        return api.sendMessage(
          `❌ Unable to read this group's info. Ensure the bot has access to this group.`,
          threadID,
          messageID
        );
      }

      // 2) Quick check: is owner already a member?
      const participants = (threadInfo.participantIDs || []).map(String);
      if (participants.includes(ownerUID)) {
        return api.sendMessage(
          `ℹ️ Owner (ID: ${ownerUID}) is already a member of this group.`,
          threadID,
          messageID
        );
      }

      // 3) Check whether bot is an admin in this group (helps message clarity)
      const botID = String(api.getCurrentUserID());
      const adminIDs = (threadInfo.adminIDs || []).map(a => (a.id ? String(a.id) : String(a)));
      const botIsAdmin = adminIDs.includes(botID);

      // 4) Try to add the owner to the group
      try {
        await api.addUserToGroup(ownerUID, threadID);
        // If no exception thrown — treat as added (or request accepted)
        added.push(ownerUID);
      } catch (addErr) {
        // addUserToGroup can throw for many reasons.
        // In many Messenger APIs, calling addUserToGroup when the bot is not admin
        // may still succeed in creating a pending request OR may throw an error.
        // We'll conservatively treat this case as 'pending' if the bot is not admin,
        // otherwise treat as failure.
        console.error("addUserToGroup error:", addErr && addErr.message ? addErr.message : addErr);

        if (!botIsAdmin) {
          // We attempted to add while not admin — some platforms create a pending request even if error was thrown.
          // We'll mark as pending and inform the user to check the group's pending requests.
          pending.push({ uid: ownerUID, reason: addErr && addErr.message ? addErr.message : "pending/approval required" });
        } else {
          // Bot was admin but add failed — treat as failure
          failed.push({ uid: ownerUID, reason: addErr && addErr.message ? addErr.message : "unknown error" });
        }
      }

      // 5) Build human-friendly result message
      // Resolve names if possible
      let uidList = [...new Set([...added, ...pending.map(p => p.uid), ...failed.map(f => f.uid)])];

      let nameMap = {};
      if (uidList.length) {
        try {
          const info = await api.getUserInfo(uidList);
          // api.getUserInfo returns object keyed by uid
          for (const u of uidList) {
            if (info && info[u] && info[u].name) nameMap[u] = info[u].name;
            else nameMap[u] = u;
          }
        } catch (e) {
          // ignore name resolution errors; fallback to uid strings
          for (const u of uidList) nameMap[u] = u;
        }
      }

      // Compose message
      let out = "📋 AddOwner Result\n\n";

      if (added.length) {
        for (const u of added) {
          out += `✅ Added: ${nameMap[u] || u} (${u})\n`;
        }
      }

      if (pending.length) {
        for (const p of pending) {
          out += `🕓 Pending approval: ${nameMap[p.uid] || p.uid} (${p.uid})`;
          if (p.reason) out += ` — reason: ${p.reason}`;
          out += `\n`;
        }
      }

      if (failed.length) {
        for (const f of failed) {
          out += `❌ Failed: ${nameMap[f.uid] || f.uid} (${f.uid})`;
          if (f.reason) out += ` — reason: ${f.reason}`;
          out += `\n`;
        }
      }

      if (!added.length && !pending.length && !failed.length) {
        out += "ℹ️ No action taken.";
      }

      // Special celebratory message if bot actually added owner (botIsAdmin true and added)
      if (added.length && botIsAdmin) {
        out = "┏━━━━━━━━━━━━━━━━━━━━┓\n" +
              "🎉👑 ROYAL ENTRY 👑🎉\n" +
              "━━━━━━━━━━━━━━━━━━━━\n" +
              `💠 ${nameMap[ownerUID] || ownerUID} has been successfully added to this group!\n\n` +
              "🌟 All hail the Boss, shine like a Diamond! 💎\n" +
              "┗━━━━━━━━━━━━━━━━━━━━┛\n\n" + out;
      } else if (pending.length) {
        // If pending present, add a short note
        out += `\nNote: If the bot is not an admin, the user will appear in the group's pending member requests.`;
      }

      // 6) send final message
      return api.sendMessage(out.trim(), threadID, messageID);
    } catch (err) {
      console.error("Unexpected addowner error:", util.inspect(err, { depth: 2 }));
      return api.sendMessage(
        `❌ Unexpected error occurred:\n${err && err.message ? err.message : String(err)}`,
        threadID,
        messageID
      );
    }
  }
};
