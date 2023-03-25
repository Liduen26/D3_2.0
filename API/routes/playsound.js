const express = require('express')
const router = express.Router()
const functions = require('../../BOT/functions')
const discord = require('../../BOT/discordmain')
const lienYTB = require('../DB_schemas/lienYTB')
const soundpath = require('../DB_schemas/soundpath')
const mongoose = require('mongoose')
const logs = require('../DB_schemas/logs')

router.post('', async (req, res) => {
  try {
    //-- Création de la réponse
    const user = await discord.client.users.fetch(req.body.userID)
    const name = user.username
    const discriminator = user.discriminator
    const time = await functions.getTime()
    //--

    //-- Check si le membre est connecté à un channel
    const Guild = discord.client.guilds.cache.get(req.body.guildID); // Getting the guild.
    const Member = Guild.members.cache.get(req.body.userID); // Getting the member.
    if (Member.voice.channel) { 
      // Connecté à un channel
    } else {
      // Pas connecté à un channel
      throw new Error(`Veuillez vous connecter à un salon vocal.`);
    };
    const channelID = Member.voice.channel.id
    //--

    await functions.joinchannel(channelID, req.body.guildID)
    infos = await soundpath.findOne({ soundpath: req.body.soundpath }, 'name') // recupere le  nom du son choisi
    await functions.playsound(req.body.guildID, req.body.soundpath)

    //-- Création du log
    const newlog = new logs();
    newlog.action = "PLAY_SOUND";
    newlog.username = name;
    newlog.discriminator = discriminator;
    newlog.guildID = req.body.guildID;
    newlog.time = time;
    newlog.options = {soundname: infos.name};
    await newlog.save(); // on envois à la bdd
    //--

    const response = {action: "PLAY_SOUND", username: name, discriminator: discriminator, guildID : req.body.guildID, soundname: infos.name, time: time}

    res.status(200).json( response )
  } catch (err) {
    res.status(500).json(err.message)
    console.log(err)
  }
})

module.exports = router