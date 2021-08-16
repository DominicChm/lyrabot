module.exports = async function ({CommandoClient}) {
    async function resolveUserFromId(userId) {
        const {username, discriminator} = await CommandoClient.users.fetch(userId);
        return {username, discriminator};
    }

    return {
        resolveUserFromId
    }
}
