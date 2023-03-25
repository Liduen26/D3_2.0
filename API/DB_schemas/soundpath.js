const { Schema, model } = require('mongoose');
const soundpathSchema = new Schema({
    name: String,
    soundpath: String,
    tags: String,
    userid: String,
    guildID: String,
    categorie: String,
    level: Number,
})

module.exports = model("soundpath", soundpathSchema, "soundpaths");