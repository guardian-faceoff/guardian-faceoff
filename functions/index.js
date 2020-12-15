const functions = require('firebase-functions');
const firebaseAdmin = require('firebase-admin');
const util = require('util');
const uuid = require('react-uuid');
const { getTokenFromBungie, refreshTokenFromBungie, getMembershipInfo } = require('./bungieHelper');
const { MATCH_STATE, MATCH_EXPIRE_TIME, IMG_URL_ROOT, AUTHORIZE_URL } = require('../src/Constants.json');

let APP_URL;
let REDIRECT_URL;
if (process.env.NODE_ENV === 'development') {
    APP_URL = 'http://localhost:5000';
    REDIRECT_URL = 'http://localhost:5001/guardian-faceoff/us-central1/bungieRedirectUrl';
} else {
    APP_URL = 'https://guardian-faceoff.web.app/';
    REDIRECT_URL = 'https://us-central1-guardian-faceoff.cloudfunctions.net/bungieRedirectUrl';
}

const firebaseApp = firebaseAdmin.initializeApp();
const db = firebaseAdmin.firestore();

const updateUserInfo = async (bungieId, skipTokenStuff) => {
    const userDoc = await db.collection('userAuthData').doc(bungieId).get();
    if (userDoc.exists) {
        const { accessToken, refreshToken } = userDoc.data();
        if (!skipTokenStuff) {
            const refreshResp = await refreshTokenFromBungie(refreshToken);
            if (refreshResp) {
                await db.collection('userAuthData').doc(bungieId).set(
                    {
                        accessToken: refreshResp.data.access_token,
                        refreshToken: refreshResp.data.refresh_token,
                    },
                    { merge: true }
                );
            }
        }
        const membershipResp = await getMembershipInfo(accessToken);
        const { destinyMemberships, primaryMembershipId } = membershipResp.data.Response;
        const primaryMembership = destinyMemberships.filter((membership) => membership.membershipId === primaryMembershipId)[0];
        db.collection('userData')
            .doc(bungieId)
            .set(
                {
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
        } catch (e) {
            console.log('User may not be created yet...trying that.');
            await firebaseApp.auth().createUser({
                uid: bungieId,
                ...userDataToUpdate,
            });
        }
    } else {
        throw new functions.https.HttpsError('aborted', 'No such user to update.');
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
        const accessToken = data.access_token;
        const refreshToken = data.refresh_token;
        const bungieId = data.membership_id;
        const firebaseToken = await firebaseApp.auth().createCustomToken(bungieId);

        await db.collection('userAuthData').doc(bungieId).set(
            {
                accessToken,
                refreshToken,
            },
            { merge: true }
        );
        await updateUserInfo(bungieId, true);

        return res.redirect(`${APP_URL}?code=${code}&state=${encodedState}&login_token=${encodeURIComponent(firebaseToken)}`);
    } catch (e) {
        console.log(e);
        return res.redirect(`${APP_URL}?error=${encodeURIComponent('Error processing user login.')}`);
    }
});

exports.getBungieAuthUrl = functions.https.onCall(async () => {
    try {
        const uniqueId = uuid();

        db.collection('stateStrings').doc(uniqueId).set({
            created: Date.now(),
        });

        return util.format(AUTHORIZE_URL, functions.config().bungie.app_id) + encodeURIComponent(`${uniqueId}|${REDIRECT_URL}`);
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
                ownerDisplayName: userDoc.data().membership.displayName,
                state: MATCH_STATE.WAITING_FOR_PLAYERS,
                maxPlayers: 2,
                players,
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
            if (matchDoc.data().state === MATCH_STATE.WAITING_FOR_START) {
                throw new functions.https.HttpsError('aborted', 'Match is already fully populated and ready to start.');
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
            t.update(userRef, { match: context.auth.uid });
            // create match
            const players = { ...matchDoc.data().players };
            players[context.auth.uid] = userDoc.data().membership.displayName;
            let newState = MATCH_STATE.WAITING_FOR_PLAYERS;
            if (Object.keys(matchDoc.data().players).length + 1 === matchDoc.data().maxPlayers) {
                newState = MATCH_STATE.WAITING_FOR_START;
            }
            t.set(
                matchRef,
                {
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

// TODO: scheduled function to get scores and update each match, and clean up expired matches (every 3 mins)
// TODO: scheduled function to clean up state strings (every day)
