const log = LyraCore.logger("Database");

module.exports = async function (config) {
    const {Low, JSONFile} = await import("lowdb");

    log("Connecting to DB")
    const adapter = new JSONFile(config.databasePath);
    const l = new Low(adapter);
    await l.read();

    l.data ||= {}; //Set default obj.

    await l.write();
    return l;
}
