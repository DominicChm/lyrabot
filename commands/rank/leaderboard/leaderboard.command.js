const {buildCommand} = LyraCore;

module.exports = buildCommand({
    run: require("./leaderboard"),
    name: 'leaderboard',
    group: 'rank',
    memberName: 'leaderboard',
    description: 'View the server XP leaderboard :heart:', //TODO: IMPROVE THIS - im no good at friendly messages :(
    args: [
        {
            key: 'leaderType',
            prompt: 'Would you like the **guild** xp leaderboard or **personal** xp leaderboard?',
            type: 'string',
            default: 'guild'
        }
    ]
});
