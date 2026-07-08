// Variables globales d'origine
export let toutesLesStationsUniques = [];
export let stationsAffichees = [];

// Configuration centrale pour simplifier les conditions de la fonction obtenirVisuelsStation
const VISUELS = {
    totem:  { logo: "src/assets/etotem-logo.png", photo: "src/assets/e-totem.jpg" },
    nge:    { logo: "src/assets/nge-logo.png",   photo: "src/assets/NGE.jpg" },
    nantes: { logo: "src/assets/NM.svg.webp",    photo: "src/assets/NMGS.jpg" },
    nmgs:   { logo: "src/assets/NM.svg.webp",    photo: "src/assets/NMGS.jpg" },
    default:{ logo: "src/assets/logo.jpg",       photo: "src/assets/photo.jpg" }
};

/* =======================================================================
     Fonction pour obtenir le logo et la photo selon l'aménageur
========================================================================= */
const obtenirVisuelsStation = (nom) => {
    const nomMinuscule = (nom || "").toLowerCase();
    const cle = Object.keys(VISUELS).find(k => nomMinuscule.includes(k)) || 'default';
    return VISUELS[cle];
};

/* =======================================================================
       Fonction principale appelée au chargement pour récupérer l'API
========================================================================= */
export const toutesLesDonnees = async () => {
    try {
        const result = await fetch("https://data.paysdelaloire.fr/api/explore/v2.1/catalog/datasets/234400034_-bornes-de-recharge/records?select=nom_amenageur%2C%20adresse_station%2C%20horaires%2C%20nbre_pdc%2C%20tranche_puissance&limit=100&refine=condition_acces%3A%22Acc%C3%A8s%20libre%22&refine=horaires%3A%2224%2F7%22&refine=libelle_commune%3A%22Nantes%22");
        const data = await result.json();

        const nomsVisites = new Set();
        toutesLesStationsUniques = data.results.filter(station => {
            const doublonKiller = station.nom_amenageur?.trim();
            return nomsVisites.has(doublonKiller) ? false : nomsVisites.add(doublonKiller);
        });

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
    const stationsListe = document.getElementById("liste-stations");
    stationsListe.innerHTML = liste.length ? "" : "<p style='padding: 10px;'>Aucune station ne correspond à votre recherche.</p>";
    stationsAffichees = liste;

    liste.forEach((element, index) => {
        const carteStation = `
            <div class="carte bord-${index % 3}" data-index="${index}">
                <h3>${element.nom_amenageur || "Nom inconnu"}</h3>
                <p>${element.adresse_station}</p>
                <span class="badge-puissance">${element.tranche_puissance || "Puissance non spécifiée"}</span>
            </div>`;
        stationsListe.insertAdjacentHTML("beforeend", carteStation);
    });
};

/* =======================================================================
             Gestion des addEventListener (Tranches de Puissance)
========================================================================= */
export const activerEcouteurs = () => {
    const barreRecherche = document.getElementById("recherche");
    const filtrePuissance = document.getElementById("filtre-puissance");

    const filtrerEtAfficher = () => {
        const saisie = barreRecherche.value.toLowerCase().trim();
        const selection = filtrePuissance.value;

        const stationsFiltrees = toutesLesStationsUniques.filter((station) => {
            const nom = (station.nom_amenageur || "").toLowerCase();
            const adresse = (station.adresse_station || "").toLowerCase();
            
            // Extrait le premier nombre trouvé dans la chaîne (ex: "AC (de 3,7 à 7,4 kW)" -> 3.7)
            const textePuissance = (station.tranche_puissance || "").replace(",", ".");
            const puissanceBorne = parseFloat(textePuissance.match(/[\d.]+/)) || 0;

            const matchTexte = nom.includes(saisie) || adresse.includes(saisie);
            
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

        afficherListeStations(stationsFiltrees);
    };

    barreRecherche.addEventListener("input", filtrerEtAfficher);
    filtrePuissance.addEventListener("change", filtrerEtAfficher);

    // Gestion du clic pour afficher le détail à gauche
    document.getElementById("liste-stations").addEventListener("click", (event) => {
        const carteCliquee = event.target.closest(".carte");
        if (!carteCliquee) return;

        const station = stationsAffichees[carteCliquee.dataset.index];
        const visuels = obtenirVisuelsStation(station.nom_amenageur);

        document.getElementById("details-station").innerHTML = `
            <h2>${station.nom_amenageur || "Nom inconnu"}</h2>
            <div id="visuels" class="visuels-station-container">
                <img class="img-photo" src="${visuels.photo}" alt="Photo">
                <img class="img-logo" src="${visuels.logo}" alt="Logo">
            </div>
            <div id="infos">
                <p><strong>Adresse : </strong> ${station.adresse_station || "—"}</p>
                <p><strong>Horaires : </strong> ${station.horaires || "—"}</p>
                <p><strong>Nombre de prises : </strong> ${station.nbre_pdc || "—"}</p>
                <p><strong>Puissance :</strong> ${station.tranche_puissance || "—"}</p>
            </div>`;
    });
};