import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

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

const createOrUpdateUserDoc = async (username) => {
    if (firebase.auth().currentUser) {
        return db.runTransaction(async (transaction) => {
            const ref = db
                .collection('users')
                .doc(firebase.auth().currentUser.uid);
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

export const passwordReset = (email) =>
    firebase.auth().sendPasswordResetEmail(email);

export const getCurrentUser = () => firebase.auth().currentUser;

export const getUser = async () => {
    return await db
        .collection('users')
        .doc(firebase.auth().currentUser.uid)
        .get();
};
