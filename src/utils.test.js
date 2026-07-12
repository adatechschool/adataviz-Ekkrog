import { describe, it, expect } from "vitest";
import {
    datAPI,
    toutesLesDonnees,
    obtenirVisuels,
    visuels,
    filtrerStations,
    obtenirStationParIndex,
} from "./utils.js";

// 1. Test de datAPI
it('datAPI rassemble les résultats de l API', async () => {
    // On passe directement la fonction anonyme en paramètre
    const resultat = await datAPI(async () => ({
        json: async () => ({
            total_count: 1,
            results: [{ nom_amenageur: 'EDF' }]
        })
    }));

    expect(resultat).toEqual({
        results: [{ nom_amenageur: 'EDF' }]
    });
});

// 2. Test de toutesLesDonnees
it('toutesLesDonnees filtre les doublons', async () => {
    // On passe directement l'objet en paramètre
    expect(await toutesLesDonnees({
        results: [
            { nom_amenageur: 'EDF' },
            { nom_amenageur: 'Total' },
            { nom_amenageur: 'EDF' }
        ]
    })).toEqual([
        { nom_amenageur: 'EDF' },
        { nom_amenageur: 'Total' }
    ]);
});

/* =========================================================
   obtenirVisuels
============================================================ */
describe("obtenirVisuels", () => {
    it("retourne les visuels par défaut si le nom est vide ou inconnu", () => {
        expect(obtenirVisuels("")).toEqual(visuels.default);
        expect(obtenirVisuels(undefined)).toEqual(visuels.default);
        expect(obtenirVisuels("Une société inconnue")).toEqual(visuels.default);
    });

    it("reconnaît 'totem' indépendamment de la casse", () => {
        expect(obtenirVisuels("E-TOTEM Services")).toEqual(visuels.totem);
        expect(obtenirVisuels("e-totem")).toEqual(visuels.totem);
    });

    it("reconnaît 'nge'", () => {
        expect(obtenirVisuels("NGE Mobilités")).toEqual(visuels.nge);
    });

    it("reconnaît 'nantes' et 'nmgs' comme équivalents", () => {
        expect(obtenirVisuels("Nantes Métropole")).toEqual(visuels.nantes);
        expect(obtenirVisuels("NMGS")).toEqual(visuels.nmgs);
    });

    it("fait un matching par sous-chaîne, pas uniquement un match exact", () => {
        expect(obtenirVisuels("Réseau ENGE Ouest")).toEqual(visuels.nge);
    });
});

/* ===========================================================
   filtrerStations
============================================================= */
describe("filtrerStations", () => {
    // On définit le tableau de base directement à l'intérieur d'une fonction pour éviter de le répéter partout
    const genererStationsTest = () => [
        { nom_amenageur: "NGE Mobilités", adresse_station: "1 rue de Nantes", tranche_puissance: "AC (de 3,7 à 7,4 kW)" },
        { nom_amenageur: "E-Totem", adresse_station: "2 avenue Foch", tranche_puissance: "3.7 kW" },
        { nom_amenageur: "Nantes Métropole", adresse_station: "3 quai de la Fosse", tranche_puissance: "22 kW" },
        { nom_amenageur: "Réseau X", adresse_station: "4 boulevard Rapide", tranche_puissance: "50 kW" },
        { nom_amenageur: "Sans puissance", adresse_station: "5 impasse Test", tranche_puissance: "" },
    ];

    it("retourne toute la liste quand la sélection est 'all' et la saisie vide", () => {
        expect(filtrerStations("", "all", genererStationsTest())).toEqual(genererStationsTest());
    });

    it("filtre par texte sur le nom de l'aménageur (insensible à la casse)", () => {
        expect(filtrerStations("nge", "all", genererStationsTest())).toEqual([genererStationsTest()[0]]);
    });

    it("filtre par texte sur l'adresse", () => {
        expect(filtrerStations("rapide", "all", genererStationsTest())).toEqual([genererStationsTest()[3]]);
    });

    it("filtre les puissances <= 3.7 kW (gère la virgule décimale)", () => {
        expect(filtrerStations("", "3.7", genererStationsTest()).map((s) => s.nom_amenageur)).toEqual(["NGE Mobilités", "E-Totem", "Sans puissance"]);
    });

    it("filtre les puissances entre 3.7 et 7.4 kW exclusif/inclusif", () => {
        expect(filtrerStations("", "7.4", genererStationsTest())).toEqual([]);
    });

    it("filtre les puissances entre 7.4 et 22 kW", () => {
        expect(filtrerStations("", "22", genererStationsTest()).map((s) => s.nom_amenageur)).toEqual(["Nantes Métropole"]);
    });

    it("filtre les puissances > 22 kW", () => {
        expect(filtrerStations("", "50", genererStationsTest()).map((s) => s.nom_amenageur)).toEqual(["Réseau X"]);
    });

    it("traite une puissance absente/vide comme 0 kW", () => {
        expect(filtrerStations("sans puissance", "3.7", genererStationsTest())).toEqual([genererStationsTest()[4]]);
    });

    it("combine le filtre texte et le filtre puissance", () => {
        expect(filtrerStations("totem", "3.7", genererStationsTest())).toEqual([genererStationsTest()[1]]);
        expect(filtrerStations("totem", "50", genererStationsTest())).toEqual([]);
    });
});

/* =======================================================================
   obtenirStationParIndex
========================================================================= */
describe("obtenirStationParIndex", () => {
    it("retourne la station correspondant à l'index donné", () => {
        expect(obtenirStationParIndex(0, [{ nom_amenageur: "A" }, { nom_amenageur: "B" }])).toEqual({ nom_amenageur: "A" });
        expect(obtenirStationParIndex(1, [{ nom_amenageur: "A" }, { nom_amenageur: "B" }])).toEqual({ nom_amenageur: "B" });
    });

    it("retourne undefined si l'index est hors limites", () => {
        expect(obtenirStationParIndex(5, [{ nom_amenageur: "A" }, { nom_amenageur: "B" }])).toBe(undefined);
    });
});