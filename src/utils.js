/* =======================================================================
         					Variables globales
========================================================================= */
let toutesLesStationsUniques = [];
let stationsAffichees = [];

/* =======================================================================
     Fonction pour obtenir le logo et la photo selon l'aménageur
========================================================================= */
const obtenirVisuelsStation = (nom) => {
    const nomMinuscule = (nom || "").toLowerCase();
    
    if (nomMinuscule.includes("totem")) {
        return {
            logo: "src/assets/etotem-logo.png", // Télécharge le logo dans assets
            photo: "src/assets/e-totem.jpg" 
        };

    } else if (nomMinuscule.includes("nge")) {
        return {
            logo: "src/assets/nge-logo.png",   // Télécharge le logo dans assets
            photo: "src/assets/NGE.jpg"         // Déjà fonctionnel !
        };

    } else if (nomMinuscule.includes("nmgs") || nomMinuscule.includes("nantes")) {
        return {
            logo: "src/assets/NM.svg.webp", // Télécharge le logo dans assets
            photo: "src/assets/NMGS.jpg"
        };
    }
    
    return {
        logo: "src/assets/logo.jpg", 
        photo: "src/assets/photo.jpg"
    };
};

/* =======================================================================
       Fonction principale appelée au chargement pour récupérer l'API
========================================================================= */
export const toutesLesDonnees = async () => {
    try {
        const result = await fetch(
            "https://data.paysdelaloire.fr/api/explore/v2.1/catalog/datasets/234400034_-bornes-de-recharge/records?select=nom_amenageur%2C%20adresse_station%2C%20horaires%2C%20nbre_pdc%2C%20tranche_puissance&limit=100&refine=condition_acces%3A%22Acc%C3%A8s%20libre%22&refine=horaires%3A%2224%2F7%22&refine=libelle_commune%3A%22Nantes%22",
        );
        const data = await result.json();

        const stationsUniques = [];
        const nomsVisites = new Set();

        data.results.forEach((station) => {
            const doublonKiller = station.nom_amenageur?.trim();

            if (!nomsVisites.has(doublonKiller)) {
                nomsVisites.add(doublonKiller);
                stationsUniques.push(station);
            }
        });

        toutesLesStationsUniques = stationsUniques;
        afficherListeStations(toutesLesStationsUniques);
        activerEcouteurs();
    } catch (err) {
        console.error("Erreur lors de la récupération des données :", err.message);
    }
};

/* =======================================================================
      Fonction réutilisable pour afficher les stations à droite
========================================================================= */
export const afficherListeStations = (liste) => {
    const stationsListe = document.querySelector(".stations-liste");
    stationsListe.innerHTML = "";
    stationsAffichees = liste;

    if (liste.length === 0) {
        stationsListe.innerHTML = "<p style='padding: 10px;'>Aucune station ne correspond à votre recherche.</p>";
        return;
    }

    liste.forEach((element, index) => {
        let classeBordure = "bord-violet";
        if (index % 3 === 1) classeBordure = "bord-vert";
        if (index % 3 === 2) classeBordure = "bord-jaune";

        const carteStation = `
      		<div class="station-carte ${classeBordure}" data-index="${index}">
       		 	<h3>${element.nom_amenageur || "Nom inconnu"}</h3>
        		<p>${element.adresse_station}</p>
        		<small class="badge-puissance">${element.tranche_puissance || "Puissance non spécifiée"}</small>
      		</div>`;
        stationsListe.insertAdjacentHTML("beforeend", carteStation);
    });
};

/* =======================================================================
             Gestion des addEventListener
========================================================================= */
const activerEcouteurs = () => {
    const stationsListe = document.querySelector(".stations-liste");
    const mainStation = document.querySelector(".main-station");
    const filtrePuissance = document.getElementById("filtre-puissance");
    const barreRecherche = document.getElementById("filtre-recherche");

    // 1. Event click : Affiche le détail dans la carte principale
    stationsListe.addEventListener("click", (event) => {
        const carteCliquee = event.target.closest(".station-carte");

        if (carteCliquee) {
            const index = carteCliquee.dataset.index;
            const stationSelectionnee = stationsAffichees[index];
            const visuels = obtenirVisuelsStation(stationSelectionnee.nom_amenageur);

            mainStation.innerHTML = `
                <h2>${stationSelectionnee.nom_amenageur || "Nom inconnu"}</h2>
                
                <div class="visuels-station-container">
                    <div class="logo-amenageur-wrapper">
                        <img src="${visuels.logo}" alt="Logo ${stationSelectionnee.nom_amenageur}">
                    </div>
                    <div class="image-station">
                        <img src="${visuels.photo}" alt="Photo de la station">
                    </div>
                </div>

                <p><strong>Adresse : </strong> ${stationSelectionnee.adresse_station || "Non renseignée"}</p>
                <p><strong>Horaires : </strong> ${stationSelectionnee.horaires || "Non renseignés"}</p>
                <p><strong>Nombre de prises : </strong> ${stationSelectionnee.nbre_pdc || "Inconnu"}</p>
                <p><strong>Puissance :</strong> ${stationSelectionnee.tranche_puissance || "Non renseignée"}</p>
            `;
        }
    });

    // 2. Recherche dynamique
    barreRecherche.addEventListener("input", (event) => {
        const saisie = event.target.value.toLowerCase().trim();
        const stationsFiltrees = toutesLesStationsUniques.filter((station) => {
            const nomAmenageur = (station.nom_amenageur || "").toLowerCase();
            const adresseStation = (station.adresse_station || "").toLowerCase();
            return nomAmenageur.includes(saisie) || adresseStation.includes(saisie);
        });
        afficherListeStations(stationsFiltrees);
    });

    // 3. Filtre puissance
    filtrePuissance.addEventListener("change", (event) => {
        const valeurSelectionnee = event.target.value;
        if (valeurSelectionnee === "all") {
            afficherListeStations(toutesLesStationsUniques);
        } else {
            const stationsFiltrees = toutesLesStationsUniques.filter((station) => {
                const puissanceText = station.tranche_puissance || "";
                if (valeurSelectionnee === "3.7") return puissanceText.includes("3,7");
                if (valeurSelectionnee === "7.4") return puissanceText.includes("7,4");
                if (valeurSelectionnee === "22") return puissanceText.includes("22");
                if (valeurSelectionnee === "50") return puissanceText.includes("50") || puissanceText.includes("supérieure");
                return false;
            });
            afficherListeStations(stationsFiltrees);
        }
    });
};