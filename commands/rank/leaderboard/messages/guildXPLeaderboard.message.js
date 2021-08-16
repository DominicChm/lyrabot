const {baseEmbed} = LyraCore;

module.exports = function (leaderboard) {
    const lb = leaderboard.map((l, i) => `${i + 1}. ${l.username}#${l.discriminator}\nLevel: ${l.level}\nXP: ${l.xp}`); // We map the outputs.

    const lbEmbed = baseEmbed()
        .setTitle(`:medal: Guild Leaderboard`)
        .setDescription("How do you stack up?");

    for (const leader of lb)
        lbEmbed.addField(leader, "=-=-=-=-=-=-=-=-=-=-=-=-=");


    return lbEmbed;
}


