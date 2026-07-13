import { toutesLesDonnees, obtenirVisuels, filtrerStations, obtenirStationParIndex } from "./utils.js";

let stationsUniques = [];
let stationsAffichees = [];

/* ============================================================
    Fonction principale appelée au chargement pour récupérer l'API
============================================================ */

/* ==========================================================
                    Fonction réutilisable
============================================================ */

export const afficherListeStations = (liste) => {
    const stationsListe = document.getElementById("liste-stations");
    stationsListe.innerHTML = liste.length
        ? ""
        : "<p style='padding: 10px;'>Aucune station ne correspond à votre recherche.</p>";
    stationsAffichees = liste;

    const compteur = document.getElementById("compteur-resultats");
    if (compteur) {
        compteur.textContent = `${liste.length} station${liste.length > 1 ? "s" : ""} trouvée${liste.length > 1 ? "s" : ""}`;
    }

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

/* ==========================================================
   Handlers appelés par les addEventListener plus bas
============================================================ */

export const afficherDetailStation = (station) => {
    const visuelsStation = obtenirVisuels(station.nom_amenageur);

    document.getElementById("details-station").innerHTML = `
    <h2>${station.nom_amenageur || "Nom inconnu"}</h2>
    <div id="visuels" class="visuels-station-container">
        <img class="img-photo" src="${visuelsStation.photo}" alt="Photo">
        <img class="img-logo" src="${visuelsStation.logo}" alt="Logo">
    </div>

    <div id="infos">
        <p><strong>Adresse : </strong> ${station.adresse_station || "—"}</p>
        <p><strong>Horaires : </strong> ${station.horaires || "—"}</p>
        <p><strong>Nombre de prises : </strong> ${station.nbre_pdc || "—"}</p>
        <p><strong>Puissance :</strong> ${station.tranche_puissance || "—"}</p>
    </div>`;
    // affiche l'info récupérée dans la BDD ou un tiret si valeur absente
};

// Detecte un clic sur l'une des stations pour afficher les détails
export const gererClicListeStations = (event) => {
    const carteCliquee = event.target.closest(".carte"); // récupère l'élément le plus proche de la classe .carte pour activer l'évènement peu importe ou on clique sur la case
    if (!carteCliquee) return; // si la carte n'est pas cliquée rien ne se passe

    const station = obtenirStationParIndex(carteCliquee.dataset.index, stationsAffichees);
    afficherDetailStation(station);
};

// point de départ de la page au chargement
export const initialiser = async () => {
    const liste = await toutesLesDonnees();
    stationsUniques= (liste || []);
    afficherListeStations(stationsUniques);
    return stationsUniques;
};

export const filtrerEtAfficher = () => {

    const barreRecherche = document.getElementById("recherche");
    const filtrePuissance = document.getElementById("filtre-puissance");

    // Sécurité : on s'assure que les éléments sont bien présents dans la page
    if (!barreRecherche || !filtrePuissance) return;

    // Filtrage des données
    const stationsFiltrees = filtrerStations(
        barreRecherche.value,
        filtrePuissance.value,
        stationsUniques,
    );
 
    afficherListeStations(stationsFiltrees);
};

// Charge la fonction appelée une fois les scripts HTML executés mais avant tous les autres éléments (ex : images et logos)
document.addEventListener("DOMContentLoaded", async () => {
    await initialiser();

    document
        .getElementById("recherche")
        .addEventListener("input", filtrerEtAfficher);
    document
        .getElementById("filtre-puissance")
        .addEventListener("change", filtrerEtAfficher);
    document
        .getElementById("liste-stations")
        .addEventListener("click", gererClicListeStations);
});
