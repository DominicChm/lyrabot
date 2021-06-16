const { CommandoClient } = require('discord.js-commando');
const { Structures, MessageEmbed, MessageAttachment } = require('discord.js');
const path = require('path');
const { prefix, token, mongodb} = require('./config.json');
const db = require('quick.db');
const Levels = require("discord-xp");
Levels.setURL(mongodb);

Structures.extend('Guild', function(Guild) {
  class MusicGuild extends Guild {
    constructor(client, data) {
      super(client, data);
      this.musicData = {
        queue: [],
        isPlaying: false,
        nowPlaying: null,
        songDispatcher: null,
        skipTimer: false, // only skip if user used leave command
        loopSong: false,
        loopQueue: false,
        volume: 1,
        id: 0
      };
    }
  }
  return MusicGuild;
});

const client = new CommandoClient({
  commandPrefix: prefix
});

client.registry
  .registerDefaultTypes()
  .registerGroups([
    ['music', ':notes: Music Command Group:'],
    ['fun', ':game_die: Fun Command Group:'],
    ['rank', ':medal: XP and Rank Related commands'],
    ['lyrautilities', ':gear: Guild Related Commands:']
  ])
  .registerDefaultGroups()
  .registerDefaultCommands({
    eval: false,
    prefix: false,
    commandState: false,
    ping: false
  })
  .registerCommandsIn(path.join(__dirname, 'commands'));

client.once('ready', () => {
  client.user.setActivity('intently | use ly!ra', { type: 'WATCHING' })
  setInterval(() => {
    client.user.setActivity('intently | use ly!ra', { type: 'WATCHING' })
  }, 10000);  
  console.log(`${client.user.tag} is Ready!`);
  const Guilds = client.guilds.cache.map(guild => guild.name);
  console.log(Guilds, 'Connected!');
});

client.on('voiceStateUpdate', async (oldState, newState) => {
  if (
    newState.member.user.bot &&
    !newState.channelID &&
    newState.guild.musicData.songDispatcher &&
    newState.member.user.id == client.user.id
  ) {
    newState.guild.musicData.queue.length = 0;
    newState.guild.musicData.songDispatcher.end();
    return;
  }
  if (
    newState.member.user.bot &&
    newState.channelID &&
    newState.member.user.id == client.user.id &&
    !newState.selfDeaf
  ) {
    newState.setSelfDeaf(true);
  }

  let member_count;
  if(!oldState.channel) {
    member_count = newState.channel.members.size;
  } else {
    member_count = oldState.channel.members.size;
  };
  //console.log(member_count);

  // check how many people are in the channel now
  if (member_count == 1) 
    setTimeout(() => { 
      if (member_count == 1) // if there's still 1 member,
        if(!oldState.channel) {
          newState.channel.leave();
        } else {
          oldState.channel.leave();
        }; 
           // leave
      }, 1); 

});

client.on("message", async (message) => {
  if (!message.guild) return;
  if (message.author.bot) return;
  
  const randomAmountOfXp = Math.floor(Math.random() * 29) + 1; // Min 1, Max 30
  const hasLeveledUp = await Levels.appendXp(message.author.id, message.guild.id, randomAmountOfXp);
  if (hasLeveledUp) {
    const user = await Levels.fetch(message.author.id, message.guild.id);
    message.channel.send(`${message.author}, congratulations! You have leveled up to **${user.level}**. :tada:`);
  }
});

client.login(token);
