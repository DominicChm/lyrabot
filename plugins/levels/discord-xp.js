let db;
const k = "discordXp";

class DiscordXp {
    static maxLeaders = 20;
    static leaderboardBuffer = 20;

    /**
     * @param {low} [Low] - A lowDB instance.
     */

    static async setDb(low) {
        if (!low) throw new TypeError("A lowDb instance was not provided");
        db = low;

        db.data[k] ||= {
            users: {},
            guilds: {},
        };

        await db.write()
    }

    static async getGuild(guildId) {
        if (!guildId)
            return guildModel();

        const guild = db.data[k].guilds[guildId] ||= guildModel();
        await db.write();
        return guild;
    }

    static async getUser(userId) {
        if (!userId)
            return userModel();

        const user = db.data[k].users[userId] ||= userModel();
        await db.write();
        return user;
    }

    static async getUserGuild(userId, guildId) {
        const gdata = (await this.getUser(userId)).guilds[guildId] ||= userGuildModel();
        await db.write();

        const g = await this.getGuild(guildId) // Call getGuild to initialize meta for this guild and add user to guild
        if (!g.users.includes(userId))
            g.users.push(userId);

        return gdata;
    }

    static async setGuildNotifications(guildId, notify) {
        (await this.getGuild(guildId)).notificationsEnabled = Boolean(notify);
    }

    /**
     * @param {string} [userId] - Discord user id.
     * @param {string} [guildId] - Discord guild id.
     */

    static async deleteUser(userId, guildId) {
        if (!userId) throw new TypeError("An user id was not provided.");

        if (guildId)
            delete await this.getUserGuild(userId, guildId); //Delete guild from user XP db entry
        else
            delete await this.getUser(userId);

        return await db.write()
    }


    static async appendUserXp(userId, xp) {
        if (!userId) throw new TypeError("An user id was not provided.");
        if (xp === 0 || !xp || isNaN(parseInt(xp))) throw new TypeError("An amount of xp was not provided/was invalid.");

        const currentTotalXp = await DiscordXp.getUserXp(userId);

        if (currentTotalXp == null)
            return;

        await DiscordXp.setUserXp(userId, currentTotalXp + xp);

        const currentLevel = DiscordXp.levelFor(currentTotalXp);
        const nextLevel = DiscordXp.levelFor(currentTotalXp + xp);

        return nextLevel !== currentLevel && nextLevel;
    }

    static async appendUserGuildXp(userId, guildId, xp) {
        if (!userId) throw new TypeError("An user id was not provided.");
        if (!guildId) return false; //undefined guild falls through to here.
        if (xp === 0 || !xp || isNaN(parseInt(xp))) throw new TypeError("An amount of xp was not provided/was invalid.");

        const currentGuildXp = await DiscordXp.getUserGuildXp(userId, guildId) || 0;

        const currentLevel = DiscordXp.levelFor(currentGuildXp);
        const nextLevel = DiscordXp.levelFor(currentGuildXp + xp)

        await DiscordXp.setUserGuildXp(userId, guildId, currentGuildXp + xp);

        return nextLevel !== currentLevel && nextLevel;
    }

    /**
     * Appends XP to both a user's personal and guild XP totals.
     * @param userId {string}
     * @param guildId {string}
     * @param xp {number}
     * @return {Promise<{guildLevel: (*|undefined), userLevel: (*|undefined)}|boolean>} The level-up result. Is either false or an object containing new guild or user level(s)
     */
    static async appendXp(userId, guildId, xp) {
        if (!userId) throw new TypeError("An user id was not provided.");

        const userLeveled = await DiscordXp.appendUserXp(userId, xp);
        const guildLeveled = await DiscordXp.appendUserGuildXp(userId, guildId, xp);

        if (userLeveled || guildLeveled)
            return {
                userLevel: userLeveled || undefined,
                guildLevel: guildLeveled || undefined
            }
        else
            return false
    }

    /**
     * @param {string} [userId] - Discord user id.
     * @param {string} [guildId] - Discord guild id.
     * @param {number} [levels] - Amount of levels to append.
     */

    static async appendLevel(userId, guildId, levels) {
        throw new Error("UNIMPLEMENTED");
    }

    static async setUserXp(userId, xp) {
        (await this.getUser(userId)).xp = xp;
        await db.write();
    }

    static async setUserGuildXp(userId, guildId, xp) {
        (await this.getUserGuild(userId, guildId)).xp = xp;
        await db.write();
    }

    static async getUserXp(userId) {
        return (await this.getUser(userId)).xp;
    }

    static async getUserGuildXp(userId, guildId) {
        return (await this.getUserGuild(userId, guildId)).xp;
    }

    /**
     * @param {string} [userId] - Discord user id.
     * @param {string} [guildId] - Discord guild id.
     * @param {number} [level] - A level to set.
     */

    static async setLevel(userId, guildId, level) {
        throw new Error("UNIMPLEMENTED");
    }

    /**
     * @param {string} [userId] - Discord user id.
     * @param {string} [guildId] - Discord guild id.
     * @param {number} [xp] - Amount of xp to subtract.
     */

    static async subtractXp(userId, guildId, xp) {
        throw new Error("UNIMPLEMENTED");
    }

    /**
     * @param {string} [userId] - Discord user id.
     * @param {string} [guildId] - Discord guild id.
     * @param {number} [levels] - Amount of levels to subtract.
     */

    static async subtractLevel(userId, guildId, levels) {
        throw new Error("UNIMPLEMENTED");
    }

    /**
     * @param {string} [guildId] - Discord guild id.
     * @param {number} [limit] - Amount of maximum enteries to return.
     */
    static async guildLeaderboard(guildId, limit = 10) {
        const g = await this.getGuild(guildId);
        const userPromises = g.users.map(async userId =>
            ({
                userId,
                xp: await this.getUserGuildXp(userId, guildId),
                level: await this.getUserGuildLevel(userId, guildId)
            })
        );

        const users = await Promise.all(userPromises);
        users.sort((u1, u2) => u2.xp - u1.xp); //Sort users

        return users.slice(0, limit);
    }

    /**
     * @param {string} [guildId] - Discord guild id.
     * @param {number} [limit] - Amount of maximum enteries to return.
     */
    static async globalGuildLeaderboard(guildId, limit = 10) {
        if (!guildId)
            throw new Error("No guild ID passed to globalGuildLeaderboard")
        const g = await this.getGuild(guildId);

        const userPromises = g.users.map(async userId =>
            ({userId, xp: await this.getUserXp(userId), level: await this.getUserLevel(userId)})
        );

        const users = await Promise.all(userPromises);
        users.sort((u1, u2) => u2.xp - u1.xp); //Sort users

        return users.slice(0, limit);
    }

    /**
     * Computes the amount of xp needed for a given level
     * @param targetLevel
     * @return {number} The amount of XP needed for the target level
     */
    static xpFor(targetLevel) {
        if (isNaN(targetLevel) || isNaN(parseInt(targetLevel, 10))) throw new TypeError("Target level should be a valid number.");
        if (isNaN(targetLevel)) targetLevel = parseInt(targetLevel, 10);
        if (targetLevel < 0) throw new RangeError("Target level should be a positive number.");

        return targetLevel ** 2 * 100;
    }

    /**
     * Computes the level for a given amount of xp
     * @param xp
     * @return {number} The
     */
    static levelFor(xp) {
        if (isNaN(xp) || isNaN(parseInt(xp, 10))) throw new TypeError("Target level should be a valid number.");
        if (isNaN(xp)) xp = parseInt(xp, 10);
        if (xp < 0) throw new RangeError("Target level should be a positive number.");

        return Math.floor((xp / 100) ** 0.5);
    }

    /**
     * @param {string} [guildId] - Discord guild id.
     */
    static async deleteGuild(guildId) {
        throw new Error("UNIMPLEMENTED");
    }

    static async getUserLevel(userId) {
        return DiscordXp.levelFor(await DiscordXp.getUserXp(userId));
    }

    static async getUserGuildLevel(userId, guildId) {
        return DiscordXp.levelFor(await DiscordXp.getUserGuildXp(userId, guildId));
    }

    static async getUserLevelXp(userId) {
        const userLevel = (await DiscordXp.getUserLevel(userId) || 0);
        return await DiscordXp.getUserXp(userId) - DiscordXp.xpFor(userLevel);

    }

    static async getGuildLevelXp(userId, guildId) {
        const userLevel = (await DiscordXp.getUserGuildLevel(userId, guildId) || 0);
        return await DiscordXp.getUserGuildXp(userId, guildId) - DiscordXp.xpFor(userLevel);
    }

    static async getLevelXpIncrement(level = 0) {
        return DiscordXp.xpFor(level + 1) - DiscordXp.xpFor(level);
    }

}

module.exports = DiscordXp;


function userModel() {
    return {
        xp: 0,
        guilds: {},
    }
}

function userGuildModel() {
    return {
        xp: 0
    }
}

function guildModel() {
    return {
        notificationsEnabled: true,
        users: [],
    }
}

function leaderboardModel(userId = "", xp = 0) {
    return {
        userId,
        xp,
    }
}
