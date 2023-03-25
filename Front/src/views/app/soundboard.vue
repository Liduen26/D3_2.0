<script setup>
import axios from 'axios';
import { ref, computed } from 'vue';
import errorVue from '../popups/error.vue';
import logo from '../../assets/icons/logo_soundboard.png';
import background from "../../assets/back/backSoundModif.jpg";
let styleBackground = { 'background': `url(${background})`}


const url = import.meta.env.VITE_URL_API || 'http://localhost:5000';

// Gère la liste des erreurs
let errors = ref([]);
function delError(i) {
    errors.value.splice(i, 1);
}

// Listes d'affichage des sons
let soundsList = [];
/**
 * Forme de l'objet : 
 * { tag: [
 *            0: {son1}
 *            1: {son2}
 *        ],
 * }
 */
let soundsWcategory = ref({});

// Listes des category
let category = [];
let displayedcategory = ref([]);

// Params des filtres
let displayFilter = ref(false);
let searchValue = ref("");
let tagFilter = ref("");

// Menu des sons
let displayMenu = ref({});

// -------------------------------- Boucle ------------------------------------
// Récupère la liste des sons
getLists();
// Update les listes de son toutes les minutes
setInterval(getLists, 60000);
// ----------------------------------------------------------------------------

/**
 * Gère l'affichage des sons
 */
let displayedSounds = computed(() => {
    let result = {};
    const searchVal = RegExp(searchValue.value, "i");
    const tagVal = tagFilter.value || "Aucune catégorie";

    // Pour chaque tag, filtre selon le contenu de la barre de recherche
    for (const tagName in soundsWcategory.value) {
        result[tagName] = soundsWcategory.value[tagName].filter(sound => {
            return  sound.name.match(searchVal) || 
                    sound.tags.match(searchVal) ||
                    sound.categorie.match(searchVal);
        });
    }

    // Si le select du filtre sélectionne un tag, n'affiche plus que lui
    if (tagVal !== "Aucune catégorie") {
        result = { [tagVal]: result[tagVal] };
    } 

    // Pour chaque tag
    for (const tag in result) {
        // Si un tag est vide on l'enlève de la liste
        if (result[tag].length <= 0) {
            delete result[tag];
        }
    }

    console.log(result);
    return result;
});

/**
 * Récupère les listes de sons, des fichiers et de yt
 */
function getLists(){
    soundsList = [];

    const reqPaths = getSoundsPaths();
    const reqYtb = getSoundsYtb();
    
    function getSoundsPaths() {
        return axios.get(url + '/api/databaseinfo/soundpaths/' + sessionStorage.idGuild)
        .then(response => {
            // Pour chaque son dans ce qu'on reçoit
            for (const sound of response.data.soundpaths) {
                // Si le son n'existe pas déjà dans la liste
                if(!soundsList.find(soundTested => soundTested._id === sound._id)) {
                    // Ajout du son
                    soundsList.push(sound);
                }
            }
        })
        .catch(error => {
            errors.value.push({type: "D3 API", content: "L'API D3 ne répond pas : " + error});
        });
    }
    function getSoundsYtb() {
        return axios.get(url + '/api/databaseinfo/youtubelinks/' + sessionStorage.idGuild)
        .then(response => {
            // Pour chaque son dans ce qu'on reçoit
            for (const sound of response.data.links) {
                // Si le son n'existe pas déjà dans la liste
                if(!soundsList.find(soundTested => soundTested._id === sound._id)) {
                    // Ajout du son
                    soundsList.push(sound);
                }
            }
        })
        .catch(error => {
            errors.value.push({type: "D3 API", content: "L'API D3 ne répond pas : " + error});
        });
    }

    Promise.all([reqPaths, reqYtb]).then(() => {
        soundsWcategory.value = [];
        category = [];

        // Pour chaque son de la liste récupérée dans les requètes précédentes
        for (const sound of soundsList) {
            // Si la catégorie est undefined => Autre
            if (!sound.categorie) {
                sound.categorie = "Autre";
            }

            // Si l'objet correspondant à la categorie n'est pas encore présent
            if (!category.includes(sound.categorie)) {
                // Ajout au tableau des category
                category.push(sound.categorie);

                // Création de l'objet dans le tableau d'affichage
                soundsWcategory.value[sound.categorie] = [];
            } 


            // N'ajoute le son que s'il n'est pas encore présent dans la liste
            if (!soundsWcategory.value[sound.categorie].includes(sound)) {
                // Définit la couleur de chaque catégorie
                switch(sound?.categorie) {
                    case "Musique": 
                        sound.color = "red";
                        break;
                    case "Bruitage": 
                        sound.color = "yellow";
                        break;
                    case "Extrait": 
                        sound.color = "blue";
                        break;
                    case "Autre": 
                        sound.color = "white";
                        break;
                    default: 
                        sound.color = "white";
                        break;

                }

                soundsWcategory.value[sound.categorie].push(sound);
            }
        }

        displayedcategory.value = category;
    })
}

//function bdd ---------------------------------------
function add(i){
    var Name = document.getElementById('name');
    console.log(Name);
    var mess = document.getElementById('link');
    console.log(mess);
    var tag = document.getElementById('tag');
    console.log(tag);
    var level = parseInt(document.getElementById('level').value);
    console.log(level);
    var categorie = document.getElementById('categorie');
    console.log(categorie);
    console.log("fin");
    axios ({
        method : 'POST',
        url : url + '/api/addyoutubelink',
        data : {
            name : Name.value,
            link : mess.value,
            tags : tag.value,
            categorie : categorie.value,
            userID : sessionStorage.idUser,
            guildID : sessionStorage.idGuild,
            level : level
        }
    })
    .then (response =>{
        setTimeout(() => {
            getLists();
            console.log("test");
        }, 1000)
    })
    .catch(error => {
        errors.value.push({type: "D3 API", content: "L'API D3 ne répond pas : " + error});
    });
}


function suppr(){
    axios ({
        method : 'POST',
        url : url + '/api/deleteyoutubelink',
        data : {
            userID : sessionStorage.idUser,
            guildID : sessionStorage.idGuild,
            id : displayMenu.value.id
        }
    })
    .then (response =>{
        setTimeout(() => {
            getLists();
            console.log("test");
        }, 1000)
    })
    .catch(error => {
        errors.value.push({type: "D3 API", content: "L'API D3 ne répond pas : " + error});
    });
}

function play(sound){
    let path = "";
    let dataToSend = {userID : sessionStorage.idUser, guildID : sessionStorage.idGuild};

    if (sound.hasOwnProperty("soundpath")) {
        path = "playsound";
        dataToSend["soundpath"] = sound.soundpath;
    } else if (sound.hasOwnProperty("lienYTB")) {
        path = "playsoundYTB";
        dataToSend["lienYTB"] = sound.lienYTB;
    }

    axios ({
        method : 'POST',
        url : url + '/api/' + path,
        data : dataToSend
    })
    .catch(error => {
        errors.value.push({type: "D3 API", content: "L'API D3 ne répond pas : " + error.response.data});
    });
}

function stop(i){
    axios ({
        method : 'POST',
        url : url + '/api/stopsound',
        data : {
            userID : sessionStorage.idUser,
            guildID : sessionStorage.idGuild,
        }
    })
    .catch(error => {
        errors.value.push({type: "D3 API", content: "L'API D3 ne répond pas : " + error});
    });
}

//function popup ---------------------------------------
function show(){
    document.getElementById("AddPopUp").style.visibility ="visible";
}

function hide(){
    document.getElementById("AddPopUp").style.visibility ="hidden";
}


/**
 * Affiche le menu contextuel des sons et le place sur la souris
 * @param {event} e 
 */
function menuCard(e, sound) {
    console.log(e.x, e.y);
    const mouse = { x: e.x, y: e.y };
    const page = document.getElementById("middle_part");
    const rect = page.getBoundingClientRect();
    const scroll = { y: page.scrollTop, x: page.scrollLeft };
    
    const coord = { left: mouse.x - rect.left + scroll.x, top: mouse.y - rect.top + scroll.y };
    displayMenu.value = { active: true, top: coord.top + 'px', left: coord.left + 'px', id: sound._id };
}

</script>

<template>
<div id="bod" @click="displayMenu.active = false" :style="styleBackground">
    <div id="top_part">
        <div id="mainBar">
            <div id="logoContainer">
                <label id="refresh" class="btn" title="Actualiser" @click="getLists">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-clockwise" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                    </svg>
                </label>
                <img :src="logo">
            </div>
            <div id="searchContainer">
                <label id="searchMusic">
                    <input placeholder="Rechercher" type="text" v-model="searchValue" title="Recherche parmi les noms, les tags, et les catégories">
                    <div class="clearText" @click="() => { searchValue = ''}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x" viewBox="0 0 16 16">
                            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                        </svg>
                    </div>
                </label>
            </div>
            <div id="btnContainer">
                <label id="filterMenu" class="btn" title="Filtre" @click="() => { displayFilter = !displayFilter }">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-sliders" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M11.5 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM9.05 3a2.5 2.5 0 0 1 4.9 0H16v1h-2.05a2.5 2.5 0 0 1-4.9 0H0V3h9.05zM4.5 7a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM2.05 8a2.5 2.5 0 0 1 4.9 0H16v1H6.95a2.5 2.5 0 0 1-4.9 0H0V8h2.05zm9.45 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm-2.45 1a2.5 2.5 0 0 1 4.9 0H16v1h-2.05a2.5 2.5 0 0 1-4.9 0H0v-1h9.05z"/>
                    </svg>
                </label>

                <label id="add" class="btn" title="Ajouter un son" @click="show()"> 
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16">
                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                    </svg>
                </label>
            </div>
        </div>
        <div id="filterBar" v-if="displayFilter">
            <label>
                Catégorie
                <select id="selectcategory" v-model="tagFilter">
                    <option>Aucune catégorie</option>
                    <option v-for="tag of category">{{ tag }}</option>
                </select>
            </label>
        </div>
        
    </div>
    <div id="middle_part" >
        
        <div class="contentList">
            <div class="empty" v-if="Object.getOwnPropertyNames(displayedSounds).length <= 0">
                <label>🤔 Hum, il semblerait qu'il n'y ait rien à afficher ici pour l'instant...</label>
            </div>
            <div class="tagCat" v-for="(sounds, tag) in displayedSounds">
                <label class="titleCat">{{ tag }}</label>
                <div class="cardContainer">
                    <div class="card" v-for="sound of sounds" @click="play(sound)" :title="'Tags : ' + sound.tags">
                        <div class="colorPastille" :style="{'background': 'radial-gradient(' + sound.color + ', transparent 70%)'} "></div>

                        <div class="content">
                            <label class="titleCard">{{ sound.name }}</label>
                        </div>
                        
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-three-dots-vertical menu" viewBox="0 0 16 16" title="Menu" @click.stop="menuCard($event, sound)">
                            <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                        </svg>
                    </div>
                </div>
            </div>
        </div>

        <div class="popupMenu" v-if="displayMenu.active" :style="{ left: displayMenu.left, top: displayMenu.top}">
            <label @click="suppr">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash bin" viewBox="0 0 16 16">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                    <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                </svg>
                Supprimer 
            </label>
            <label @click="stop">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-stop-fill" viewBox="0 0 16 16">
                    <path d="M5 3.5h6A1.5 1.5 0 0 1 12.5 5v6a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 11V5A1.5 1.5 0 0 1 5 3.5z"/>
                </svg>
                Stop 
            </label>
        </div>
    </div>   
    <div id="AddPopUp"> 
        <div id="TopBar">
            <button id="croix" @click="hide()">❌</button>
        </div>
        <div class="form"> Name :  </div>
        <input class="content" id = "name" type="text" placeholder="nom du son">
        <div class="form"> Link :  </div>
        <input class="content" id = "link" type="text" placeholder="lien du son">
        <div class="form"> Tag :  </div>
        <input class="content" id = "tag" type="text" placeholder="Tag ">
        <div class="form"> Catégorie :  </div>
        <select name="categorie" id="categorie">
            <option value="Musique"> Musique </option>
            <option value="Bruitage"> Bruitage </option>
            <option value="Extrait"> Extrait </option>
            <option value="Autre"> Autre </option>
        </select>
        <div class="form" id="access"> accesssibilité :  </div>
        <select name="level" id="level">
            <option value="1"> privé </option>
            <option value="2"> serveur </option>
            <option value="3"> tout le monde </option>
        </select>
        <div><button class="formbutton" id="Ajouter" @click="add()"> Ajouter </button></div>
    </div>     
</div>

<errorVue v-for="(err, i) of errors" :key="i" @delpopup="delError(i)">
    Erreur : {{ err.type }} <br>
    {{ err.content }}
</errorVue>
</template>

<!-- Variables -->
<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Chakra+Petch&family=Lobster&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Titillium+Web:wght@300&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Quicksand&family=Righteous&display=swap');

:root {
    --colorMain: #0B132B;
    --color1: #1C2541;
    
    --color2: #3A506B;
    --color2Var: #9AA7B8;
    --color2Var2: #86B9F7;
    --color3: #5CBFBE;
    --color3Var: #438C8B;
    --color4: #70FEE8;

    --font-interface: 'Titillium Web', sans-serif;
    --font-cat: 'Quicksand', sans-serif;
    --font-card: 'Righteous', cursive;
}
</style>

<!-- Mise en page -->
<style scoped lang="scss">

#bod {
    color: aliceblue;
    // background-color: var(--colorMain); 
    // background: linear-gradient(var(--colorMain), #183740);
    // background: linear-gradient(blue, pink);
    

    width: 100%;
    height: 100%;

    display: flex;
    flex-direction: column;
}

#top_part {
    display: flex;
    flex-direction: column;
    border-top: 1px solid var(--color2);
    border-bottom: 1px solid var(--color2);
    
    font-family: var(--font-interface);

    transition: all .5s;
}

#middle_part {
    padding: 10px;
    min-height: 100px;
    margin: 3px;
    
    position: relative;
    overflow: auto;   

    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    
    /* Works on Firefox */
    & {
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.6) transparent;
    }

    /* Works on Chrome, Edge, and Safari */
    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background-color: rgba(255, 255, 255, 0.6);
    }

}
</style>

<!-- MainBar -->
<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Titillium+Web:wght@300&display=swap');

#mainBar {
    display: flex;
    align-items: center;
    background-color: var(--color1);
    padding: 5px;
    
    #logoContainer {
        width: 30%;
        display: flex;
        align-items: center;
        justify-content: space-around;

        img {
            height: 7vh;

            &:hover {
                // :D
                animation: .5s looping;

                @keyframes looping {
                    from{
                        transform: rotateZ(0deg);
                    } to {
                        transform: rotateZ(360deg);
                    }
                }
            }
        }

        #refresh {
            svg {
                position: relative;
                top: 0.1vh;
                width: 4vh;
                height: 2.8vh;
            }
        }
    }

    #searchContainer {
        width: 60%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
        
        #searchMusic {
            display: flex;
            justify-content: center;
            flex: 1;
            max-width: 80vh;
            
            input {
                background-color: transparent;
                border: none;
                outline: 1px solid var(--color2);
                
                font-family: var(--font-interface);
                font-size: 2vh;
                color: white;
                width: 80%;
                height: 4vh;

                padding: 3px 10px;
                border-top-left-radius: 5px;     
                border-bottom-left-radius: 5px;
            }

            .clearText {
                outline: 1px solid var(--color2);
                color: var(--color2Var);
                border-left: 0;
                height: 4vh;

                display: flex;
                align-items: center;

                border-top-right-radius: 5px;
                border-bottom-right-radius: 5px;

                margin-left: 1px;
                padding: 0 5px;

                svg {
                    width: 100%;
                    height: 3.5vh;
                }

                &:hover svg {
                    color: var(--color4)
                }
            }
        }
    }
    .btn {
        height: 4vh;
        width: 8vh;
        margin: 5px;
        border-radius: 5px;
        
        display: flex;
        justify-content: center;
        align-items: center;

        color: black;
        background-color: var(--color3);
        transition: background-color .01s;

        &:hover {
            background-color: var(--color3Var);
        }
    }

    #btnContainer {
        width: 30%;
        display: flex;
        justify-content: space-evenly;
        flex-wrap: wrap;


        #filterMenu {
            svg {
                width: 5vh;
                height: 3vh;
            }
        }

        #add {
            svg {
                width: 5vh;
                height: 3.5vh;
            }
        }
    }
}

</style>

<!-- FilterBar -->
<style scoped lang="scss">
#filterBar {
    padding: 5px;
    background-color: var(--color1);
    font-size: 2vh;

    display: flex;
    justify-content: right;


    // transform: translateY(-100%);
    // animation: 1s Appears both;

    // @keyframes Appears {
    //     from {
    //         transform: translateY(-100%);
    //     } to {
    //         transform: translateY(0%);
    //     }
    // }

    #selectcategory {
        margin-right: 20px;
        margin-left: 5px;

        background-color: var(--color1);
        border: none;
        outline: 1px solid var(--color2);
        
        font-family: var(--font-interface);
        font-size: 2vh;
        color: white;
        width: 250px;
        height: 4vh;

        padding: 3px 10px;
        border-radius: 5px;

        option {
            font-family: var(--font-interface);
            font-size: 1.6vh;
            color: white;
        }
    }
}
</style>

<!-- Content -->
<style scoped lang="scss">
.contentList {
    width: 100%;
    max-width: 140vh;

    .empty {
        display: flex;
        justify-content: center;
        margin-top: 15vh;
        font-family: var(--font-interface);
        font-size: 3vh;
    }

    .tagCat {
        display: flex;
        flex-direction: column;
        font-family: var(--font-interface);
    
        margin-top: 15px;
        // border-bottom: 1px solid white;
    
        .titleCat {
            height: 100%;
            margin: 10px;
    
            font-size: 2.5vh;
    
            margin: 0px 30px;
            font-family: var(--font-cat);
        }
    
        .cardContainer {
            display: flex;
            flex-wrap: wrap;
            
            .card {
                margin: 10px;
                padding: 3vh 2vh;
                margin-left: 10px;
                min-width: 25vh;
    
                display: flex;
                flex-direction: column;
                position: relative;
    
                border-radius: 3px;
                transition: transform .3s;
                box-shadow: inset 0px 0px 5px rgb(0, 0, 0, 0.6);
    
                outline: 1px solid var(--color2Var2);
                background-color: var(--color2);
                
                font-family: var(--font-card);

                &:hover {
                    transform: scale(106%);
                }
    
                .content {
                    display: flex;
                    justify-content: center;
                    margin: 5px;
    
                    .titleCard {
                        font-size: 2.3vh;
                    }
                }
    
                .menu {
                    position: absolute;
                    top: 5px;
                    right: 0px;

                    width: 3vh;
                    height: 2vh;
                }

                .colorPastille {
                    position: absolute;
                    width: 3px;
                    height: 80%;
                    border-radius: 5px;

                    left: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    // background-color: red;
                    // background: radial-gradient(red, transparent);
                }

            }
        }
    }
}

.popupMenu {
    padding: 8px;
    border-radius: 5px;
    background-color: white;
    color: black;
    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.7);
    z-index: 999;

    position: absolute;
    display: flex;
    flex-direction: column;

    label {
        padding: 2px 5px;
        border-radius: 5px;
        font-family: var(--font-interface);
        display: flex;
        align-items: center;

        &:hover {
            background-color: rgba(0, 0, 0, 0.2);
        }

        svg {
            margin-right: 5px;
        }
    }


}
</style>

<!-- popup -->
<style scoped lang="scss">
#AddPopUp{
    position: absolute;
    background-color: rgba(69, 123, 157, 0.7);
    height: fit-content;
    width: 50%;
    margin-left: 25%;
    margin-top: 5%;
    text-align: center;
    border-radius: 5px;
    box-shadow: 5px 5px 5px black;
    visibility: hidden;
    transition: 200ms;
    border: solid 1px #a8dadc;
    font-family: var(--font-interface);
    

    #TopBar
    {
        width: 100%;
        height: 100%;
        background-color: #a2d2ff;
        padding-left: 94%;
        border-radius: 5px;
        
        
    }

    .form
    {
        padding-top: 5px;
        padding-bottom: 5px;
        margin-right: 100px;

    }

    .content{
        padding-bottom: 5px;
        border: 2px solid #86B9F7;
        border-radius: 2px;
    }

    #categorie{
        width: 145px;
        cursor: pointer;
    }

    #access{
        margin-right: 45px;
    }

    #level{
        width: 145px;
        cursor: pointer;
    }


    .formbutton
    {
        width: 100px;
        height: 30px;
        margin-left: 15px;
        background-color: #ee5253;
        font-family: var(--font-interface);
        color: aliceblue;
        cursor: pointer;
        margin-top: 10px;
        margin-bottom: 5px;
        
        &:hover{
            background-color: #ff6b6b;
        }
    }

    


}





</style>