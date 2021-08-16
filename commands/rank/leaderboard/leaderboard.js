const guildXPLeaderboard = require("./messages/guildXPLeaderboard.message");
const personaXPLeaderboard = require("./messages/personaXPLeaderboard.message");

async function resolveUserIds(leaderboard, resolveUserFromId) {
    return Promise.all(leaderboard.map(async l => {
        const uid = l.userId;
        return {...l, ...await resolveUserFromId(uid)};
    }));
}

module.exports = async function (message, {leaderType}) {
    const Levels = LyraCore.plugins.levels
    const resolveUserFromId = LyraCore.plugins.snowflakeResolver.resolveUserFromId;
    let target = message.mentions.users.first() || message.author;

    const uid = target.id;
    const gid = message.guild.id;

    if (leaderType === "guild") {
        const lb = await resolveUserIds(await Levels.guildLeaderboard(gid), resolveUserFromId);
        return await message.say(guildXPLeaderboard(lb));

    } else if (leaderType === "personal") {
        const lb = await resolveUserIds(await Levels.globalGuildLeaderboard(gid), resolveUserFromId);
        return await message.say(personaXPLeaderboard(lb));

    } else {
        return await message.say(`Invalid argument >${leaderType}<`);
    }
}
