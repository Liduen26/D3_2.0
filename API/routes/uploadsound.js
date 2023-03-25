const express = require('express')
const router = express.Router()
const multer = require('multer')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '../sound')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})
const upload = multer({ storage: storage }).single('file')

router.post('/upload', (req, res) => {
  upload(req, res, (err) => {

    if (err) {
      return res.status(400).json({ success: false, message: err })
    } else {
      return res.status(200).json({ success: true, message: 'Fichier uploadé avec succès' });
    }
  })
  /*function saveFormDataToSoundFolder(formData) {
    // Récupération des données du fichier audio à partir de l'objet FormData
    const file = formData.get('audioFile');
  
    // Chemin du dossier "sound"
    const soundFolderPath = '../sound';
  
    // Création du dossier "sound" s'il n'existe pas déjà
    if (!fs.existsSync(soundFolderPath)) {
      fs.mkdirSync(soundFolderPath);
    }
  
    // Enregistrement du fichier audio dans le dossier "sound"
    fs.writeFileSync(`${soundFolderPath}/${file.name}`, file);
  }*/
})

module.exports = router