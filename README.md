# Courier

Courier is currently a static concept demo for a two-sided matchmaking product.
It presents the core idea:

- people, teams, and projects can discover each other through swipeable cards
- users reject or save profiles the way they would in a matchmaking app
- mutual saves become matches and open the door to conversation

## Files

- `info.html` is the main Courier concept page
- `script.js` powers the preview swipe deck
- `style.css` contains the full visual system and layout
- `create.html` is the minimal people/team creation page
- `create.js` saves profiles to Firebase Firestore when configured
- `firebase-config.js` holds your Firebase web app config

## Run

Open `info.html` in Live Server or any simple static server and hard refresh if the page is cached.

## Firebase Setup

1. Create a Firebase web app and a Firestore database.
2. Replace the placeholder values in `firebase-config.js` with your Firebase web config.
3. Create a `profiles` collection in Firestore, or let the app create it on first save.
4. Open `create.html` to submit new `Person` or `Team` profiles.
5. Open `info.html` to see those Firestore profiles appear in the swipe deck.

For now, Firestore-backed profiles are merged into the bundled demo data:
- new `Person` records appear on the `Team side`
- new `Team` records appear on the `Talent side`
