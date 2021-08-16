const {buildCommand, plugins} = LyraCore;

module.exports = buildCommand({
    run: require("./lyra"),
    name: 'help',
    group: 'lyrautilities',
    memberName: 'help',
    description: 'A help command',
    icon: ":sparkles:"
});
