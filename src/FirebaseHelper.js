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
if (window.location.hostname.indexOf('localhost') > -1) {
    console.warn('Using local firebase emulators...');
    db.useEmulator('localhost', 8080);
    functions.useEmulator('localhost', 5001);
    auth.useEmulator('http://localhost:9099/');
}

// track watchers to allow for unsubbing
const watchMap = {};

const snapshotToArray = (snapshot) => {
    const returnArr = [];
    snapshot.forEach((childSnapshot) => {
        const item = childSnapshot.data();
        item.id = childSnapshot.id;
        returnArr.push(item);
    });
    return returnArr;
};

export const onAuthStateChanged = (callback) => {
    firebase.auth().onAuthStateChanged(callback);
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

export const logoutOfFirebase = () => {
    Object.keys(watchMap).forEach((docId) => {
        watchMap[docId]();
    });
    firebase.auth().signOut();
};

export const getCurrentUser = () => firebase.auth().currentUser;

export const getCurrentUserData = async () => {
    return await db.collection('userData').doc(firebase.auth().currentUser.uid).get();
};

export const createMatch = async () => {
    const createMatchFunc = functions.httpsCallable('createMatch');
    const result = await createMatchFunc();
    return result;
};
export const joinMatch = async (matchId) => {
    const joinMatchFunc = functions.httpsCallable('joinMatch');
    const result = await joinMatchFunc(matchId);
    return result;
};

export const cancelMatch = async (matchId) => {
    const cancelMatchFunc = functions.httpsCallable('cancelMatch');
    const result = await cancelMatchFunc(matchId);
    return result;
};

export const getCurrentMatch = async () => {
    const { uid } = firebase.auth().currentUser;
    const matchesRef = db.collection('matches');
    const currentMatchSnapshot = await matchesRef.where(`players.${uid}`, 'not-in', ['']).limit(1).get();
    return snapshotToArray(currentMatchSnapshot)[0];
};

export const watchDoc = async (collection, docId, onSnapShot, onError) => {
    const doc = db.collection(collection).doc(docId);
    if (watchMap[`${collection}-${docId}`]) {
        console.log(`Unsubbing from doc: ${collection}/${docId}`);
        watchMap[`${collection}-${docId}`]();
    }
    const unsub = doc.onSnapshot((docUpdate) => {
        if (docUpdate.data()) {
            onSnapShot({ id: docUpdate.id, ...docUpdate.data() });
        } else {
            onSnapShot();
        }
    }, onError);
    watchMap[`${collection}-${docId}`] = unsub;
};
export const getMatches = async (stateFilter) => {
    const matchesRef = db.collection('matches');
    let snapshot;
    if (stateFilter) {
        snapshot = await matchesRef.where('state', '==', stateFilter).orderBy('expires').limit(10).get();
    } else {
        snapshot = await matchesRef.orderBy('expires').limit(10).get();
    }
    return snapshotToArray(snapshot);
};

export const getCompletedMatches = async () => {
    const userData = await db.collection('userData').doc(firebase.auth().currentUser.uid).get();
    let completedMatches;
    if (userData && userData.data) {
        completedMatches = userData.data().completedMatches;
    }
    return completedMatches;
};

export const getCurrentUserStatsData = async () => {
    return await db.collection('userStats').doc(firebase.auth().currentUser.uid).get();
};

export const getAllUserStatsData = async (orderBy, direction = 'asc') => {
    const userStatsDataRef = db.collection('userStats');
    let snapshot;
    if (orderBy) {
        snapshot = await userStatsDataRef.orderBy(orderBy, direction).limit(100).get();
    } else {
        snapshot = await userStatsDataRef.orderBy('displayName').limit(100).get();
    }
    return snapshotToArray(snapshot);
};

export const getBungieAuthUrl = async () => {
    const getAuthUrl = functions.httpsCallable('getBungieAuthUrl');
    const result = await getAuthUrl();
    return result;
};

export const refreshLogin = async () => {
    const refresh = functions.httpsCallable('refreshLogin');
    const result = await refresh();
    return result;
};
