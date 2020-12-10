import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/functions';

// Configure Firebase.
const firebaseConfig = {
    apiKey: 'AIzaSyAdeDCJmaLped2kNQarq7_CrK9DRYlkhsM',
    authDomain: 'guardian-faceoff.firebaseapp.com',
    databaseURL: 'https://guardian-faceoff.firebaseio.com',
    projectId: 'guardian-faceoff',
    storageBucket: 'guardian-faceoff.appspot.com',
    messagingSenderId: '268391200810',
    appId: '1:268391200810:web:d33d1c4a1edcc4d7a62b53',
    measurementId: 'G-9NYSCKBRX8',
};

// Initialize Firebase App
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const functions = firebase.functions();
const auth = firebase.auth();
if (window.location.hostname.indexOf('ngrok.io') > -1 || window.location.hostname.indexOf('localhost') > -1) {
    // eslint-disable-next-line no-console
    console.warn('Using local firebase emulators...');
    db.useEmulator('localhost', 8080);
    functions.useEmulator('localhost', 5001);
    auth.useEmulator('http://localhost:9099/');
}

const createOrUpdateUserDoc = async (username) => {
    if (firebase.auth().currentUser) {
        return db.runTransaction(async (transaction) => {
            const ref = db.collection('users').doc(firebase.auth().currentUser.uid);
            const doc = await transaction.get(ref);
            if (!doc.data()) {
                const updateObj = {
                    lastLogin: Date.now(),
                };
                if (username) {
                    updateObj.username = username;
                }
                await transaction.set(ref, updateObj);
            }
        });
    }
    return Promise.resolve();
};
createOrUpdateUserDoc();

export const loginWithEmail = async (email, password) => {
    await firebase.auth().signInWithEmailAndPassword(email, password);
    await createOrUpdateUserDoc();
};

export const registerWithEmail = async (email, password) => {
    await firebase.auth().createUserWithEmailAndPassword(email, password);
    await createOrUpdateUserDoc();
};

export const logout = () => firebase.auth().signOut();

export const passwordReset = (email) => firebase.auth().sendPasswordResetEmail(email);

export const getCurrentUser = () => firebase.auth().currentUser;

export const getUser = async () => {
    return await db.collection('users').doc(firebase.auth().currentUser.uid).get();
};

// ////////

export const getFirebaseCustomToken = async (d2AuthToken) => {
    const getCustomToken = functions.httpsCallable('getFirebaseCustomToken');
    const result = await getCustomToken({ d2AuthToken });
    return result;
};

export const loginWithCustomToken = async (customToken) => {
    let res;
    try {
        res = await firebase.auth().signInWithCustomToken(customToken);
    } catch (e) {
        console.error(e);
    }
    return res;
};

export const getBungieAuthUrl = async () => {
    const getAuthUrl = functions.httpsCallable('getBungieAuthUrl');
    const result = await getAuthUrl();
    return result;
};
