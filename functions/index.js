const functions = require('firebase-functions');
const firebaseAdmin = require('firebase-admin');
const uuid = require('react-uuid');

const bungieJson = require('./getBungieJson');

// const TOKEN_URL = 'https://www.bungie.net/Platform/App/OAuth/token/';
const AUTHORIZE_URL = `https://www.bungie.net/en/OAuth/Authorize?client_id=${bungieJson.BUNGIE_APP_ID}&response_type=code&state=`;
let APP_URL;
let REDIRECT_URL;
if (process.env.NODE_ENV === 'development') {
    APP_URL = 'http://localhost:5000';
    REDIRECT_URL = 'http://localhost:5001/guardian-faceoff/us-central1/bungieRedirectUrl';
} else {
    APP_URL = 'https://guardian-faceoff.firebaseapp.com/';
    REDIRECT_URL = `${APP_URL}guardian-faceoff/us-central1/bungieRedirectUrl`;
}

const firebaseApp = firebaseAdmin.initializeApp();
const db = firebaseAdmin.firestore();

const stateStrings = {};

exports.bungieRedirectUrl = functions.https.onRequest(async (req, res) => {
    // const { code } = req.query;
    const encodedState = req.query.state;
    const stateParts = decodeURIComponent(encodedState).split('|');
    const [state] = stateParts;
    const docRef = db.collection('stateStrings').doc(state);
    const doc = await docRef.get();
    if (!doc.exists) {
        throw new functions.https.HttpsError('aborted', 'Request was not initiated from this application.');
    } else {
        docRef.delete();
    }
    return res.redirect(APP_URL);
});

exports.getBungieAuthUrl = functions.https.onCall(async () => {
    try {
        const uniqueId = uuid();
        stateStrings[uniqueId] = true;

        db.collection('stateStrings').doc(uniqueId).set({
            created: Date.now(),
        });

        return AUTHORIZE_URL + encodeURIComponent(`${uniqueId}|${REDIRECT_URL}`);
    } catch (err) {
        throw new functions.https.HttpsError('aborted', 'Failed to get bungie auth url.', err);
    }
});

exports.getFirebaseCustomToken = functions.https.onCall(async (data) => {
    try {
        const firebaseToken = await firebaseApp.auth().createCustomToken(data.d2AuthToken);
        return firebaseToken;
    } catch (err) {
        throw new functions.https.HttpsError('aborted', 'Failed to get custom firebase token.', err);
    }
});

// throw new functions.https.HttpsError('aborted', 'Failed to get custom firebase token.', {
//     'some-key': 'some-value',
// });
