import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
    getFirestore,
    addDoc,
    collection,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const form = document.getElementById("createProfileForm");
const clearButton = document.getElementById("clearCreateForm");
const output = document.getElementById("createOutput");
const status = document.getElementById("createStatus");

if (form && clearButton && output && status) {
    let db = null;

    function setStatus(message, kind) {
        status.className = "form-feedback" + (kind ? " " + kind : "");
        status.textContent = message;
    }

    function resetOutput() {
        output.textContent = "Fill the form to generate a profile object.";
    }

    function getFirebaseConfig() {
        const config = window.COURIER_FIREBASE_CONFIG;
        if (!config || !config.apiKey || config.apiKey === "YOUR_API_KEY") {
            return null;
        }
        return config;
    }

    function getDb() {
        if (db) {
            return db;
        }

        const config = getFirebaseConfig();
        if (!config) {
            return null;
        }

        const app = getApps()[0] || initializeApp(config);
        db = getFirestore(app);
        return db;
    }

    function buildEntry(formData) {
        const abilities = String(formData.get("profileAbilities") || "")
            .split(",")
            .map(function (value) {
                return value.trim();
            })
            .filter(Boolean);

        return {
            type: String(formData.get("profileType") || "").trim(),
            name: String(formData.get("profileName") || "").trim(),
            shortDescription: String(formData.get("profileDescription") || "").trim(),
            abilities: abilities,
            timeAbility: String(formData.get("profileTimeAbility") || "").trim(),
            location: String(formData.get("profileLocation") || "").trim(),
            createdAt: serverTimestamp()
        };
    }

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const entry = buildEntry(formData);
        output.textContent = JSON.stringify(
            {
                type: entry.type,
                name: entry.name,
                shortDescription: entry.shortDescription,
                abilities: entry.abilities,
                timeAbility: entry.timeAbility,
                location: entry.location
            },
            null,
            2
        );

        const firestore = getDb();
        if (!firestore) {
            setStatus("Firebase is not configured yet. Add your project keys in firebase-config.js to save profiles.", "error");
            return;
        }

        try {
            setStatus("Saving profile to Firebase...");
            await addDoc(collection(firestore, "profiles"), entry);
            setStatus("Profile saved to Firestore.", "success");
            form.reset();
        } catch (error) {
            setStatus("Could not save profile: " + error.message, "error");
        }
    });

    clearButton.addEventListener("click", function () {
        form.reset();
        resetOutput();
        setStatus("");
    });
}
