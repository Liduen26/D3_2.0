
<template>
    <input type="file" ref="fileInput" @change="uploadFile" accept=".mp3, .wav"/>
</template>


<script>
export default {
  methods: {
    async uploadFile() {
      let input = this.$refs.fileInput
      let file = input.files[0]
        // créer un FormData pour envoyer les fichiers
        let formData = new FormData()
        formData.append("file", file)
        try {
          //envoyer la requête avec fetch
          let response = await fetch("/api/uploadsound/upload", {
            method: "POST",
            body: formData
          });
          let data = await response.json();
          if(data.success) console.log("Fichier uploadé avec succès");
          else console.log("Erreur lors de l'upload");
        } catch (e) {
          console.log("Erreur lors de l'upload", e);
        }
    }
  }
}
</script>


<style>
#app {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    background-color: #202225;
}

.btn {
    font-size: 4vh;
    font-family: 'Courier New', Courier, monospace;
    padding: 1vh 3vh;
    background-color: cadetblue;
    cursor: pointer;
    border-radius: 1vh;
    text-align: center;
}

input[type="file"] {
    /* display: none; */
}
</style>

