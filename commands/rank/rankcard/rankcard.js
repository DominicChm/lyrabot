const commando = require('discord.js-commando');
const Discord = require('discord.js');
const canvacord = require("canvacord");
const guildXpMessage = require('./messages/guildXPMessage.message');
const personalXpMessage = require("./messages/personalXPMessage.message");
const errorMessage = require("./messages/error.message");


module.exports = async function (message, {xpType}) {
    const Levels = LyraCore.plugins.levels
    let target = message.mentions.users.first() || message.author;

    const uid = target.id;
    const gid = message.guild.id;

    //if (!user) return message.channel.send("Seems like this user has not earned any xp so far.");


    if (xpType === "guild") {
        const userData = {
            backgroundImg: "wallpaper2.jpg",
            level: await Levels.getUserGuildLevel(uid, gid),
            xp: await Levels.getGuildLevelXp(uid, gid),
            requiredXp: await Levels.getLevelXpIncrement(await Levels.getUserGuildLevel(uid, gid)),
            message,
        }

        return await message.say(await guildXpMessage(userData))
    } else if (xpType === "personal") {
        const userData = {
            backgroundImg: "wallpaper2.jpg",
            level: await Levels.getUserLevel(uid),
            xp: await Levels.getUserLevelXp(uid),
            requiredXp: await Levels.getLevelXpIncrement(await Levels.getUserLevel(uid)),
            message,
        }

        return await message.say(await personalXpMessage(userData))

    } else {
        return await message.say(errorMessage())
    }
}
