/* ==========================================================
   Ce fichier ne contient QUE des fonctions pures :
   pas de DOM, pas de fetch, pas d'état mutable de module.
   Elles sont donc testables uniquement avec
   describe/it/expect().toBe()/toEqual(), sans vi.fn()
   ni beforeEach de manipulation du DOM.
============================================================ */

// Configuration centrale pour simplifier les conditions de la fonction obtenirVisuels
export const visuels = {
    totem: {
        logo: "src/assets/etotem-logo.png",
        photo: "src/assets/e-totem.jpg",
    },
    nge: {
        logo: "src/assets/nge-logo.png",
        photo: "src/assets/NGE.jpg",
    },
    nantes: {
        logo: "src/assets/NM.svg.webp",
        photo: "src/assets/NMGS.jpg",
    },
    nmgs: {
        logo: "src/assets/NM.svg.webp",
        photo: "src/assets/NMGS.jpg",
    },

    default: {
        logo: "src/assets/logo.jpg",
        photo: "src/assets/photo.jpg",
    },
};

// POUR AVOIR + de DATA :
    // Utilise la pagination (offset) car l'API plafonne à 100 résultats par appel : on enchaîne les appels jusqu'à avoir tout récupéré.
// stations.js

// On permet d'injecter une fonction "fetchFn" personnalisée (par défaut, le fetch global)
export const datAPI = async (fetchFn = fetch) => {
    try {
        const toutesLesReponses = [];
        const tailleParPage = 100;
        let decalage = 0;
        let total = Infinity;

        while (decalage < total) {
            const url = `https://data.paysdelaloire.fr/api/explore/v2.1/catalog/datasets/234400034_-bornes-de-recharge/records?select=nom_amenageur%2C%20adresse_station%2C%20horaires%2C%20nbre_pdc%2C%20tranche_puissance&limit=${tailleParPage}&offset=${decalage}&refine=condition_acces%3A%22Acc%C3%A8s%20libre%22&refine=horaires%3A%2224%2F7%22&refine=libelle_commune%3A%22Nantes%22`;

            // Utilise la fonction passée en paramètre
            const result = await fetchFn(url);
            const donnees = await result.json();

            toutesLesReponses.push(...donnees.results);
            total = donnees.total_count;
            decalage += tailleParPage;
        }

        return { results: toutesLesReponses };
    } catch (error) {
        return { results: [] };
    }
};

// On permet de passer directement des données brutes pour éviter de dépendre de datAPI()
export const toutesLesDonnees = async (donneesBrutes) => {
    const donnees = donneesBrutes || await datAPI();
    const noDoublon = new Set();
    return donnees.results.filter((station) => {
        const nomAmenageur = station.nom_amenageur?.trim();
        if (!nomAmenageur || noDoublon.has(nomAmenageur)) return false;
        noDoublon.add(nomAmenageur);
        return true;
    });
};

/* ==========================================================
     Fonction pour obtenir le logo et la photo selon l'aménageur
============================================================ */

export const obtenirVisuels = (nom) => {
    const nomMinuscule = (nom || "").toLowerCase(); // évite de faire planter le code si le nom est vide, affiche "" si c'est le cas
    const cle =
        Object.keys(visuels).find((k) => nomMinuscule.includes(k)) || "default"; // récupère toutes les "keys" de visuels : ("totem", "NGE", "Nantes") et cherche si l'une d'elles est incluse dans le nom de la station, sinon retourne les visuels par défaut
    return visuels[cle]; // si le nom inclut une "key", retourne le visuel (logo + photo) correspondant
};

/* ==========================================================
   Logique pure de filtrage, extraite pour être testable
   sans dépendre du DOM (pas de lecture de <input>/<select> ici)
   NB : pas de valeur par défaut sur "liste" — l'état
   (stationsUniques) vit maintenant dans main.js, qui doit
   toujours la passer explicitement.
============================================================ */
export const filtrerStations = (saisie, selection, liste = []) => {
    const saisieNormalisee = (saisie || "").toLowerCase().trim();

    return liste.filter((station) => {
        const nom = (station.nom_amenageur || "").toLowerCase();
        const adresse = (station.adresse_station || "").toLowerCase();

        // Extrait le premier nombre trouvé dans la chaîne (ex: "AC (de 3,7 à 7,4 kW)" -> 3.7)
        const textePuissance = (station.tranche_puissance || "").replace(
            ",",
            ".",
        );
        const puissanceBorne =
            parseFloat(textePuissance.match(/[\d.]+/)) || 0; /*
            C'est du regex, ca recherche un caractère qui est soit un chiffre "\d", soit un point ".", plusieurs fois à la suite "+"
            */

        const matchTexte =
            nom.includes(saisieNormalisee) ||
            adresse.includes(saisieNormalisee);

        // Logique de filtrage par tranches / intervalles
        let matchPuissance = false;

        if (selection === "all") {
            matchPuissance = true;
        } else if (selection === "3.7") {
            // Inférieure ou égale à 3.7 kW
            matchPuissance = puissanceBorne <= 3.7;
        } else if (selection === "7.4") {
            // Supérieure à 3.7 kW ET inférieure ou égale à 7.4 kW
            matchPuissance = puissanceBorne > 3.7 && puissanceBorne <= 7.4;
        } else if (selection === "22") {
            // Supérieure à 7.4 kW ET inférieure ou égale à 22 kW
            matchPuissance = puissanceBorne > 7.4 && puissanceBorne <= 22;
        } else if (selection === "50") {
            // Supérieure à 22 kW
            matchPuissance = puissanceBorne > 22;
        }

        return matchTexte && matchPuissance;
    });
};

/* ==========================================================
   Logique pure : retrouve une station par son index dans
   une liste donnée. Extraite pour être testable
   indépendamment du DOM / d'un event de clic.
   NB : pas de valeur par défaut sur "liste" pour la même
   raison que filtrerStations ci-dessus.
============================================================ */
export const obtenirStationParIndex = (index, liste = []) => {
    return liste[index];
};