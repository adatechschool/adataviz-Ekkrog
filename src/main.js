import { initialiser } from "./utils.js";

// Charge la fonction appelée une fois les scripts HTML executés mais avant tous les autres éléments (images)
document.addEventListener("DOMContentLoaded", async () => {
    initialiser()
});
