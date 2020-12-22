const functions = require('firebase-functions');
const firebaseAdmin = require('firebase-admin');
const util = require('util');
const uuid = require('react-uuid');
const { getTokenFromBungie, getMembershipInfo, getProfile } = require('./bungieHelper');
const { MATCH_STATE, MATCH_EXPIRE_TIME, MATCH_PLAY_EXPIRE_TIME, IMG_URL_ROOT, AUTHORIZE_URL, MEMBERSHIP_TYPES } = require('../src/Constants.json');
const { processMatches } = require('./processMatches');

const EMULATOR_MODE = process.env.FUNCTIONS_EMULATOR === 'true';

let APP_ID;
let APP_URL;
let REDIRECT_URL;
if (EMULATOR_MODE) {
    console.log('Running in emulator mode!');
    APP_ID = functions.config().bungie.dev.app_id;
    APP_URL = 'http://localhost:5000';
    REDIRECT_URL = 'http://localhost:5001/guardian-faceoff/us-central1/bungieRedirectUrl';
} else {
    console.log('Running in production mode!');
    APP_ID = functions.config().bungie.prod.app_id;
    APP_URL = 'https://guardian-faceoff.web.app';
    REDIRECT_URL = 'https://us-central1-guardian-faceoff.cloudfunctions.net/bungieRedirectUrl';
}

const firebaseApp = firebaseAdmin.initializeApp();
const db = firebaseAdmin.firestore();

const updateUserInfo = async (bungieId) => {
    const membershipResp = await getMembershipInfo(bungieId, MEMBERSHIP_TYPES.ALL);
    const { destinyMemberships, primaryMembershipId } = membershipResp.data.Response;
    const primaryMembership = destinyMemberships.filter((membership) => membership.membershipId === primaryMembershipId)[0];

    const profileResp = await getProfile(primaryMembership.membershipType, primaryMembershipId);
    const { characters } = profileResp.data.Response;
    const characterArray = Object.keys(characters.data).map((characterId) => characters.data[characterId]);
    const currentCharacter = characterArray.sort((a, b) => {
        const aDateMs = new Date(a.dateLastPlayed).getTime();
        const bDateMs = new Date(b.dateLastPlayed).getTime();
        return bDateMs - aDateMs;
    })[0];

    db.collection('userData')
        .doc(bungieId)
        .set(
            {
                currentCharacter,
                membership: { ...primaryMembership, iconURL: IMG_URL_ROOT + primaryMembership.iconPath },
            },
            { merge: true }
        );
    const userDataToUpdate = {
        displayName: membershipResp.data.Response.bungieNetUser.displayName,
        photoURL: IMG_URL_ROOT + membershipResp.data.Response.bungieNetUser.profilePicturePath,
    };
    try {
        await firebaseApp.auth().updateUser(bungieId, userDataToUpdate);
    } catch (e1) {
        // User may not be created yet...trying that
        try {
            await firebaseApp.auth().createUser({
                uid: bungieId,
                ...userDataToUpdate,
            });
        } catch (e2) {
            console.error(e1, e2);
            throw new functions.https.HttpsError('aborted', 'Failed to update user info.', e2);
        }
    }
};

exports.bungieRedirectUrl = functions.https.onRequest(async (req, res) => {
    const { code } = req.query;
    const encodedState = req.query.state;
    const stateParts = decodeURIComponent(encodedState).split('|');
    const [state] = stateParts;
    const docRef = db.collection('stateStrings').doc(state);
    const doc = await docRef.get();
    if (!doc.exists) {
        return res.redirect(`${APP_URL}?error=${encodeURIComponent('Request was not initiated from this application.')}`);
    }
    docRef.delete();

    try {
        const { data } = await getTokenFromBungie(code);
        const bungieId = data.membership_id;
        const firebaseToken = await firebaseApp.auth().createCustomToken(bungieId);

        await updateUserInfo(bungieId, true);

        const builtRedirectUrl = `${APP_URL}?code=${code}&state=${encodedState}&login_token=${encodeURIComponent(firebaseToken)}`;
        return res.redirect(builtRedirectUrl);
    } catch (e) {
        console.error(e);
        return res.redirect(`${APP_URL}?error=${encodeURIComponent('Error processing user login.')}`);
    }
});

exports.getBungieAuthUrl = functions.https.onCall(async () => {
    try {
        const uniqueId = uuid();

        db.collection('stateStrings').doc(uniqueId).set({
            created: Date.now(),
        });

        return util.format(AUTHORIZE_URL, APP_ID) + encodeURIComponent(`${uniqueId}|${REDIRECT_URL}`);
    } catch (err) {
        throw new functions.https.HttpsError('aborted', 'Failed to get bungie auth url.', err);
    }
});

exports.refreshLogin = functions.https.onCall(async (data, context) => {
    try {
        await updateUserInfo(context.auth.uid);
    } catch (err) {
        throw new functions.https.HttpsError('aborted', 'Failed to refresh your login.', err);
    }
});

exports.createMatch = functions.https.onCall(async (data, context) => {
    if (!context.auth.uid) {
        throw new functions.https.HttpsError('aborted', 'Please login.');
    }
    try {
        const userRef = db.collection('userData').doc(context.auth.uid);
        const matchRef = db.collection('matches').doc(context.auth.uid);
        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            if (userDoc.data().match) {
                throw new functions.https.HttpsError('aborted', 'User already in a match.');
            }
            // update user data
            t.update(userRef, { match: context.auth.uid });
            // create match
            const players = {};
            players[context.auth.uid] = userDoc.data().membership.displayName;
            t.set(matchRef, {
                owner: context.auth.uid,
                state: MATCH_STATE.WAITING_FOR_PLAYERS,
                maxPlayers: 2,
                players,
                created: Date.now(),
                expires: Date.now() + MATCH_EXPIRE_TIME,
            });
        });
    } catch (err) {
        console.error(err);
        throw new functions.https.HttpsError('aborted', 'Failed to create match.', err);
    }
});

exports.joinMatch = functions.https.onCall(async (matchId, context) => {
    if (!context.auth.uid) {
        throw new functions.https.HttpsError('aborted', 'Please login.');
    }
    if (!matchId) {
        throw new functions.https.HttpsError('aborted', 'No match specified to join.');
    }
    try {
        const userRef = db.collection('userData').doc(context.auth.uid);
        const matchRef = db.collection('matches').doc(matchId);
        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            const matchDoc = await t.get(matchRef);
            if (!matchDoc.exists) {
                throw new functions.https.HttpsError('aborted', 'The match does not exist.');
            }
            if (matchDoc.data().state === MATCH_STATE.IN_PROGRESS) {
                throw new functions.https.HttpsError('aborted', 'Match is already in progress.');
            }
            if (matchDoc.data().state === MATCH_STATE.COMPLETE) {
                throw new functions.https.HttpsError('aborted', 'Match is already completed.');
            }
            if (matchDoc.data().state === MATCH_STATE.EXPIRED) {
                throw new functions.https.HttpsError('aborted', 'Match has expired.');
            }
            if (userDoc.data().match) {
                throw new functions.https.HttpsError('aborted', 'User already in a match.');
            }
            // update user data
            t.update(userRef, { match: matchId });
            // create match
            const players = { ...matchDoc.data().players };
            players[context.auth.uid] = userDoc.data().membership.displayName;
            let newState = MATCH_STATE.WAITING_FOR_PLAYERS;
            if (Object.keys(matchDoc.data().players).length + 1 === matchDoc.data().maxPlayers) {
                newState = MATCH_STATE.IN_PROGRESS;
            }
            t.set(
                matchRef,
                {
                    expires: Date.now() + MATCH_PLAY_EXPIRE_TIME,
                    state: newState,
                    maxPlayers: matchDoc.data().maxPlayers,
                    players,
                },
                { merge: true }
            );
        });
    } catch (err) {
        console.error(err);
        throw new functions.https.HttpsError('aborted', 'Failed to join match.', err);
    }
});

exports.cancelMatch = functions.https.onCall(async (matchId, context) => {
    if (!context.auth.uid) {
        throw new functions.https.HttpsError('aborted', 'Please login.');
    }
    if (!matchId) {
        throw new functions.https.HttpsError('aborted', 'No match specified to cancel.');
    }
    if (context.auth.uid !== matchId) {
        throw new functions.https.HttpsError('aborted', 'You cannot cancel a match you did not create.');
    }
    try {
        const usersRef = db.collection('userData');
        const matchRef = db.collection('matches').doc(context.auth.uid);
        await db.runTransaction(async (t) => {
            const matchDoc = await t.get(matchRef);
            if (!matchDoc.exists) {
                throw new functions.https.HttpsError('aborted', 'The match does not exist.');
            }
            if (matchDoc.data().state !== MATCH_STATE.WAITING_FOR_PLAYERS) {
                throw new functions.https.HttpsError('aborted', 'Cannot cancel a match that has started.');
            }
            // update user data
            const snapshot = await usersRef.where('match', '==', context.auth.uid).get();
            snapshot.forEach((doc) => {
                const userRef = db.collection('userData').doc(doc.id);
                t.set(
                    userRef,
                    {
                        match: null,
                    },
                    { merge: true }
                );
                // TODO : ADD ALERT FOR USER
            });
            // delete match
            t.delete(matchRef);
        });
    } catch (err) {
        console.error(err);
        throw new functions.https.HttpsError('aborted', 'Failed to cancel match.', err);
    }
});

exports.processMatches = functions.pubsub.schedule('every 5 minutes').onRun(() => {
    processMatches(db);
});
if (EMULATOR_MODE) {
    setInterval(() => {
        console.warn('Running processMatches via setTimeout due to running in emulator mode.');
        processMatches(db);
    }, 20000);
}

const deleteStateStrings = async () => {
    try {
        await db.runTransaction(async (t) => {
            const stateStringsRef = db.collection('stateStrings');
            const now = Date.now();
            const oneMinuteAgo = now - 60000;
            const snapshot = await stateStringsRef.where('created', '<', oneMinuteAgo).get();
            snapshot.forEach((doc) => {
                t.delete(doc.ref);
            });
        });
    } catch (err) {
        console.error(err);
        throw new functions.https.HttpsError('aborted', 'Failed to cancel match.', err);
    }
    return null;
};
exports.deleteStateStrings = functions.pubsub.schedule('every 6 hours').onRun(deleteStateStrings);
if (EMULATOR_MODE) {
    setInterval(() => {
        console.warn('Running deleteStateStrings via setTimeout due to running in emulator mode.');
        deleteStateStrings();
    }, 60000);
}

// SEED DATA FOR FISH SO I CAN DEVELOP LOL
// (() => {
//     const fishmobile = {
//         currentCharacter: {
//             dateLastPlayed: '2020-12-16T04:20:28Z',
//             raceType: 1,
//             minutesPlayedTotal: '54040',
//             levelProgression: { progressionHash: 1716568313, levelCap: 50, progressToNextLevel: 0, weeklyLimit: 0, weeklyProgress: 0, nextLevelAt: 0, dailyLimit: 0, level: 50, currentProgress: 0, dailyProgress: 0, stepIndex: 50 },
//             emblemBackgroundPath: '/common/destiny2_content/icons/970a0fbc2d1c0108907c3dedd0d4a3a1.jpg',
//             classType: 2,
//             raceHash: 2803282938,
//             characterId: '2305843009300307482',
//             emblemColor: { alpha: 255, green: 13, blue: 13, red: 8 },
//             membershipType: 3,
//             percentToNextLevel: 0,
//             baseCharacterLevel: 50,
//             membershipId: '4611686018467485679',
//             classHash: 2271682572,
//             light: 1261,
//             stats: { 144602215: 93, 392767087: 29, 1735777505: 43, 1935470627: 1261, 1943323491: 106, 2996146975: 45, 4244567218: 48 },
//             minutesPlayedThisSession: '171',
//             emblemPath: '/common/destiny2_content/icons/caeffd922381d7a2d8b70f1e9fe8db6c.jpg',
//             genderHash: 3111576190,
//             genderType: 0,
//             emblemHash: 1138508272,
//         },
//         match: '7610179',
//         membership: {
//             LastSeenDisplayName: 'Fishmobile',
//             applicableMembershipTypes: [2, 3],
//             isPublic: true,
//             displayName: 'Fishmobile',
//             iconPath: '/img/theme/bungienet/icons/steamLogo.png',
//             membershipType: 3,
//             crossSaveOverride: 3,
//             LastSeenDisplayNameType: 3,
//             iconURL: 'https://www.bungie.net/img/theme/bungienet/icons/steamLogo.png',
//             membershipId: '4611686018467485679',
//         },
//     };
//     db.collection('userData').doc('7610179').set(fishmobile);
//     db.collection('matches')
//         .doc('7610179')
//         .set({
//             owner: 7610179,
//             state: MATCH_STATE.WAITING_FOR_PLAYERS,
//             maxPlayers: 2,
//             players: { 7610179: 'Fishmobile' },
//             created: Date.now(),
//             expires: Date.now() + MATCH_EXPIRE_TIME,
//         });
// })();
