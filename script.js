import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
    getFirestore,
    collection,
    getDocs,
    orderBy,
    query
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const cardStack = document.getElementById("previewCardStack");
const template = document.getElementById("previewCardTemplate");
const resetButton = document.getElementById("previewResetButton");
const rejectButton = document.getElementById("previewRejectButton");
const saveButton = document.getElementById("previewSaveButton");
const leftFeedback = document.querySelector(".swipe-feedback-left");
const rightFeedback = document.querySelector(".swipe-feedback-right");
const modeButtons = document.querySelectorAll("[data-mode]");
const heroTitle = document.getElementById("heroTitle");
const heroText = document.getElementById("heroText");
const heroRules = document.getElementById("heroRules");
const viewerName = document.getElementById("viewerName");
const viewerSummary = document.getElementById("viewerSummary");
const viewerPreferences = document.getElementById("viewerPreferences");
const viewerFeed = document.getElementById("viewerFeed");
const flowSteps = document.getElementById("flowSteps");
const deckHeading = document.getElementById("deckHeading");
const deckCaption = document.getElementById("deckCaption");
const currentModeLabel = document.getElementById("currentModeLabel");
const deckProgress = document.getElementById("deckProgress");
const dataStatus = document.getElementById("dataStatus");

if (
    cardStack &&
    template &&
    resetButton &&
    rejectButton &&
    saveButton &&
    heroTitle &&
    heroText
) {
    const swipeThreshold = 110;
    let data = null;
    let db = null;
    let currentMode = "talent";
    let activeIndex = 0;
    let dragState = null;

    function setStatus(message, kind) {
        if (!dataStatus) {
            return;
        }
        dataStatus.className = "form-feedback" + (kind ? " " + kind : "");
        dataStatus.textContent = message;
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

    function getModeData() {
        return data.modes[currentMode];
    }

    function setList(container, items, className) {
        container.innerHTML = "";
        items.forEach(function (item, index) {
            if (className === "timeline-step") {
                const node = document.createElement("div");
                node.className = className;
                const step = document.createElement("span");
                const text = document.createElement("p");
                step.textContent = String(index + 1).padStart(2, "0");
                text.textContent = item;
                node.appendChild(step);
                node.appendChild(text);
                container.appendChild(node);
                return;
            }

            if (container.tagName === "UL") {
                const listItem = document.createElement("li");
                listItem.textContent = item;
                container.appendChild(listItem);
                return;
            }

            const node = document.createElement("span");
            node.className = className;
            node.textContent = item;
            container.appendChild(node);
        });
    }

    function normalizeFirestoreCard(docData) {
        const fallbackPalette =
            docData.type === "Team"
                ? ["#f16c3d", "#f3a64f"]
                : ["#70b8ff", "#5d6bff"];

        return {
            type: docData.type || "Person",
            name: docData.name || "Untitled profile",
            shortDescription: docData.shortDescription || "",
            abilities: Array.isArray(docData.abilities) ? docData.abilities : [],
            timeAbility: docData.timeAbility || "",
            location: docData.location || "Remote",
            openTo: docData.type === "Team"
                ? "People who fit this team"
                : "Teams and projects that match this profile",
            matchScore: "New",
            palette: Array.isArray(docData.palette) ? docData.palette : fallbackPalette
        };
    }

    async function loadFirestoreProfiles() {
        const firestore = getDb();
        if (!firestore) {
            setStatus("Using bundled demo data. Add Firebase config to load live profiles.", "");
            return [];
        }

        try {
            const snapshot = await getDocs(query(collection(firestore, "profiles"), orderBy("createdAt", "desc")));
            setStatus("Live Firebase data connected.", "success");
            return snapshot.docs.map(function (doc) {
                return normalizeFirestoreCard(doc.data());
            });
        } catch (error) {
            setStatus("Firebase connected, but profiles could not load: " + error.message, "error");
            return [];
        }
    }

    function renderShell() {
        const mode = getModeData();

        heroTitle.textContent = mode.heroTitle;
        heroText.textContent = mode.heroText;
        deckHeading.textContent = mode.deckHeading;
        deckCaption.textContent = mode.deckCaption;
        viewerName.textContent = mode.viewer.name;
        viewerSummary.textContent = mode.viewer.summary;
        currentModeLabel.textContent = mode.label;

        setList(heroRules, mode.flow, "chip-list-item");
        setList(viewerPreferences, mode.viewer.preferences, "chip");
        setList(viewerFeed, mode.viewer.feedIncludes, "chip");
        setList(flowSteps, mode.flow, "timeline-step");

        modeButtons.forEach(function (button) {
            button.classList.toggle("is-active", button.getAttribute("data-mode") === currentMode);
        });
    }

    function renderDeck() {
        const cards = getModeData().cards;
        cardStack.innerHTML = "";

        cards.slice(activeIndex, activeIndex + 3)
            .map(function (card, index) {
                const node = createCard(card);

                if (index === 0) {
                    node.classList.add("is-top");
                    attachDrag(node);
                }
                if (index === 1) {
                    node.classList.add("is-below");
                }
                if (index === 2) {
                    node.classList.add("is-third");
                }

                node.style.zIndex = String(30 - index);
                return node;
            })
            .reverse()
            .forEach(function (node) {
                cardStack.appendChild(node);
            });

        const remaining = cards.length - activeIndex;
        deckProgress.textContent = remaining > 0 ? (activeIndex + 1) + " of " + cards.length : "Deck complete";
        resetButton.classList.toggle("hidden", remaining > 0);
        rejectButton.disabled = remaining === 0;
        saveButton.disabled = remaining === 0;
    }

    function createCard(card) {
        const fragment = template.content.cloneNode(true);
        const element = fragment.querySelector(".swipe-card");

        element.querySelector(".card-kind").textContent = card.type;
        element.querySelector(".card-location").textContent = card.location;
        element.querySelector(".card-name").textContent = card.name;
        element.querySelector(".card-short-description").textContent = card.shortDescription;
        element.querySelector(".card-time-ability").textContent = card.timeAbility;
        element.querySelector(".card-match-score").textContent = card.matchScore;
        element.querySelector(".card-open-to").textContent = card.openTo;

        const abilities = element.querySelector(".ability-list");
        card.abilities.forEach(function (ability) {
            const item = document.createElement("li");
            item.textContent = ability;
            abilities.appendChild(item);
        });

        element.style.setProperty("--card-color-a", card.palette[0]);
        element.style.setProperty("--card-color-b", card.palette[1]);

        return element;
    }

    function attachDrag(card) {
        card.addEventListener("pointerdown", onPointerDown);
    }

    function onPointerDown(event) {
        const card = event.currentTarget;
        dragState = {
            card: card,
            startX: event.clientX,
            startY: event.clientY,
            currentX: 0,
            currentY: 0
        };

        card.classList.add("is-dragging");
        card.setPointerCapture(event.pointerId);
        card.addEventListener("pointermove", onPointerMove);
        card.addEventListener("pointerup", onPointerUp);
        card.addEventListener("pointercancel", onPointerUp);
    }

    function onPointerMove(event) {
        if (!dragState) {
            return;
        }

        dragState.currentX = event.clientX - dragState.startX;
        dragState.currentY = event.clientY - dragState.startY;

        const rotation = dragState.currentX * 0.06;
        dragState.card.style.transform = "translate(" + dragState.currentX + "px, " + dragState.currentY + "px) rotate(" + rotation + "deg)";

        updateFeedback(dragState.currentX);
    }

    function onPointerUp(event) {
        if (!dragState) {
            return;
        }

        const card = dragState.card;
        const currentX = dragState.currentX;

        card.classList.remove("is-dragging");
        card.releasePointerCapture(event.pointerId);
        card.removeEventListener("pointermove", onPointerMove);
        card.removeEventListener("pointerup", onPointerUp);
        card.removeEventListener("pointercancel", onPointerUp);

        if (Math.abs(currentX) > swipeThreshold) {
            swipeTopCard(currentX > 0 ? "right" : "left");
        } else {
            resetTopCard(card);
        }

        dragState = null;
    }

    function resetTopCard(card) {
        clearFeedback();
        card.style.transform = "";
        card.style.opacity = "";
    }

    function swipeTopCard(direction) {
        const topCard = cardStack.querySelector(".is-top");

        if (!topCard) {
            return;
        }

        const horizontalExit = direction === "right" ? window.innerWidth : -window.innerWidth;
        const rotation = direction === "right" ? 24 : -24;

        showFinalFeedback(direction);
        topCard.style.transform = "translate(" + horizontalExit + "px, -20px) rotate(" + rotation + "deg)";
        topCard.style.opacity = "0";
        topCard.style.pointerEvents = "none";

        window.setTimeout(function () {
            clearFeedback();
            activeIndex += 1;
            renderDeck();
        }, 220);
    }

    function updateFeedback(offsetX) {
        leftFeedback.classList.toggle("is-visible", offsetX < -28);
        rightFeedback.classList.toggle("is-visible", offsetX > 28);
    }

    function showFinalFeedback(direction) {
        leftFeedback.classList.toggle("is-visible", direction === "left");
        rightFeedback.classList.toggle("is-visible", direction === "right");
    }

    function clearFeedback() {
        leftFeedback.classList.remove("is-visible");
        rightFeedback.classList.remove("is-visible");
    }

    function switchMode(mode) {
        currentMode = mode;
        activeIndex = 0;
        clearFeedback();
        renderShell();
        renderDeck();
    }

    function mergeFirestoreCards(baseData, firestoreCards) {
        const people = firestoreCards.filter(function (card) {
            return card.type === "Person";
        });
        const teams = firestoreCards.filter(function (card) {
            return card.type === "Team";
        });

        baseData.modes.team.cards = people.concat(baseData.modes.team.cards);
        baseData.modes.talent.cards = teams.concat(baseData.modes.talent.cards);
    }

    modeButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            switchMode(button.getAttribute("data-mode"));
        });
    });

    rejectButton.addEventListener("click", function () {
        swipeTopCard("left");
    });

    saveButton.addEventListener("click", function () {
        swipeTopCard("right");
    });

    resetButton.addEventListener("click", function () {
        activeIndex = 0;
        renderDeck();
    });

    fetch("./courier-data.json")
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Unable to load courier-data.json");
            }

            return response.json();
        })
        .then(async function (json) {
            data = json;
            const firestoreCards = await loadFirestoreProfiles();
            mergeFirestoreCards(data, firestoreCards);
            renderShell();
            renderDeck();
        })
        .catch(function (error) {
            deckProgress.textContent = "Data error";
            cardStack.innerHTML = '<p class="error-message">' + error.message + "</p>";
            rejectButton.disabled = true;
            saveButton.disabled = true;
            setStatus("The base demo data could not load.", "error");
        });
}
