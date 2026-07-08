import { toutesLesDonnees } from "./utils.js";

fetch(
    "https://data.paysdelaloire.fr/api/explore/v2.1/catalog/datasets/234400034_-bornes-de-recharge/records?select=nom_amenageur%2C%20adresse_station%2C%20nbre_pdc%2C%20puissance_nominale%2C%20loc&limit=100&refine=condition_acces%3A%22Acc%C3%A8s%20libre%22&refine=libelle_commune%3A%22Nantes%22"
);

document.addEventListener("DOMContentLoaded", () => {
    toutesLesDonnees();
});
