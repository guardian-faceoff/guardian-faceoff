const firebaseAdmin = require('firebase-admin');
const functions = require('firebase-functions');
const { getActivityHistory } = require('./bungieHelper');
const { MATCH_STATE, EXTRA_TIME_FOR_PROCESSING } = require('../src/Constants.json');

const getPlayerStats = (playerCommonActivity, wins, losses, ties) => {
    return {
        match: null,
        stats: {
            wins: firebaseAdmin.firestore.FieldValue.increment(wins),
            losses: firebaseAdmin.firestore.FieldValue.increment(losses),
            ties: firebaseAdmin.firestore.FieldValue.increment(ties),
            score: firebaseAdmin.firestore.FieldValue.increment(playerCommonActivity.values.score.basic.value),
            kills: firebaseAdmin.firestore.FieldValue.increment(playerCommonActivity.values.kills.basic.value),
            deaths: firebaseAdmin.firestore.FieldValue.increment(playerCommonActivity.values.deaths.basic.value),
            assists: firebaseAdmin.firestore.FieldValue.increment(playerCommonActivity.values.assists.basic.value),
        },
    };
};

const processMatch = async (db, matchDoc) => {
    try {
        const startTime = Date.now();
        const matchData = matchDoc.data();
        if (matchData.expires + EXTRA_TIME_FOR_PROCESSING > Date.now()) {
            const playersSnapshot = await db.collection('userData').where('match', '==', matchDoc.id).get();
            const playerActivityHistory = {};
            const playerActivityHistoryPromises = [];
            playersSnapshot.forEach(async (playerDoc) => {
                const playerData = playerDoc.data();
                const promise = getActivityHistory(playerData.membership.membershipType, playerData.membership.membershipId, playerData.currentCharacter.characterId);
                playerActivityHistoryPromises.push(promise);
                promise.then((activityHistory) => {
                    playerActivityHistory[playerDoc.id] = activityHistory.data.Response.activities;
                });
            });
            await Promise.all(playerActivityHistoryPromises);
            const playerActivityHistoryArray = Object.keys(playerActivityHistory).map((bungieId) => playerActivityHistory[bungieId]);
            const firstPlayerActivities = playerActivityHistoryArray[0];
            let commonActivityId;
            let commonActivityTime;
            if (matchData.commonActivityId && matchData.commonActivityId !== null) {
                commonActivityId = matchData.commonActivityId;
            } else {
                firstPlayerActivities.forEach((activity) => {
                    if (!commonActivityId && new Date(activity.period).getTime() > matchData.created) {
                        const activityId = activity.activityDetails.instanceId;
                        const otherPlayersWithSameActivity = playerActivityHistoryArray.filter((otherPlayerActivityHistory) => {
                            return (
                                otherPlayerActivityHistory.filter((otherPlayerActivity) => {
                                    return activityId === otherPlayerActivity.activityDetails.instanceId;
                                }).length > 0
                            );
                        }).length;
                        if (otherPlayersWithSameActivity === matchData.maxPlayers) {
                            commonActivityId = activityId;
                            commonActivityTime = activity.period;
                        }
                    }
                });
            }
            if (commonActivityId) {
                const matchesAlreadyTrackedSnapshot = await db.collection('completedMatches').where('commonActivityId', '==', commonActivityId).limit(1).get();
                if (matchesAlreadyTrackedSnapshot.size > 0) {
                    console.log('Already tracked this match. Waiting for another...');
                } else {
                    await db.runTransaction(async (t) => {
                        await t.update(db.collection('matches').doc(matchDoc.id), {
                            commonActivityId,
                        });
                        // check if activity is done
                        const playersCompleted = [];
                        const playersNotCompleted = [];
                        const playersCommonActivityMap = {};
                        Object.keys(playerActivityHistory).forEach((playerId) => {
                            const playerActivities = playerActivityHistory[playerId];
                            [playersCommonActivityMap[playerId]] = playerActivities.filter((activity) => {
                                return commonActivityId === activity.activityDetails.instanceId;
                            });
                            // console.log(playersCommonActivityMap[playerId].values.completed);
                            // console.log(playersCommonActivityMap[playerId].values.completionReason);
                            if (playersCommonActivityMap[playerId].values.completed.basic.value === 1) {
                                playersCompleted.push(playerId);
                            } else {
                                playersNotCompleted.push(playerId);
                            }
                        });
                        console.log('====================== playersCompleted.length', playersCompleted.length);

                        if (playersCompleted.length > 0) {
                            // TODO: check time played seconds maybe?
                            const sortedPlayersByScoreAndCompleted = Object.keys(playersCommonActivityMap).sort((a, b) => {
                                const playerACompleted = playersCommonActivityMap[a].values.completed.basic.value === 1;
                                const playerBCompleted = playersCommonActivityMap[b].values.completed.basic.value === 1;
                                if (playerACompleted && !playerBCompleted) {
                                    return -1;
                                }
                                if (!playerACompleted && playerBCompleted) {
                                    return 1;
                                }
                                const playerAScore = playersCommonActivityMap[a].values.score.basic.value;
                                const playerBScore = playersCommonActivityMap[b].values.score.basic.value;
                                return playerBScore - playerAScore;
                            });
                            const mostScore = playersCommonActivityMap[sortedPlayersByScoreAndCompleted[0]].values.score.basic.value;
                            const winners = sortedPlayersByScoreAndCompleted.filter((playerId) => {
                                const playerHadMostScore = playersCommonActivityMap[playerId].values.score.basic.value === mostScore;
                                const playerCompletedMatch = playersCommonActivityMap[playerId].values.completed.basic.value === 1;
                                return playerHadMostScore && playerCompletedMatch;
                            });
                            const losers = sortedPlayersByScoreAndCompleted.filter((playerId) => {
                                const playerHadLessThanMostScore = playersCommonActivityMap[playerId].values.score.basic.value < mostScore;
                                const playerCompletedMatch = playersCommonActivityMap[playerId].values.completed.basic.value !== 1;
                                return playerHadLessThanMostScore || playerCompletedMatch;
                            });

                            const completedMatchData = {
                                ...matchData,
                                state: playersNotCompleted.length > 0 ? MATCH_STATE.PLAYER_QUIT : MATCH_STATE.COMPLETE,
                                matchTime: new Date(commonActivityTime).getTime(),
                                winners,
                                losers,
                                stats: sortedPlayersByScoreAndCompleted.map((playerId) => {
                                    return {
                                        playerId,
                                        score: playersCommonActivityMap[playerId].values.score.basic.value,
                                        kills: playersCommonActivityMap[playerId].values.kills.basic.value,
                                        deaths: playersCommonActivityMap[playerId].values.deaths.basic.value,
                                        assists: playersCommonActivityMap[playerId].values.assists.basic.value,
                                        completed: playersCommonActivityMap[playerId].values.completed.basic.value === 1,
                                    };
                                }),
                            };

                            const promises = [];
                            if (winners.length > 1) {
                                winners.forEach(async (playerId) => {
                                    promises.push(
                                        t.set(
                                            db.collection('userData').doc(playerId),
                                            {
                                                ...getPlayerStats(playersCommonActivityMap[playerId], 0, 0, 1),
                                                completedMatches: firebaseAdmin.firestore.FieldValue.arrayUnion(completedMatchData),
                                            },
                                            { merge: true }
                                        )
                                    );
                                });
                            } else {
                                winners.forEach(async (playerId) => {
                                    promises.push(
                                        t.set(
                                            db.collection('userData').doc(playerId),
                                            {
                                                ...getPlayerStats(playersCommonActivityMap[playerId], 1, 0, 0),
                                                completedMatches: firebaseAdmin.firestore.FieldValue.arrayUnion(completedMatchData),
                                            },
                                            { merge: true }
                                        )
                                    );
                                });
                            }
                            losers.forEach(async (playerId) => {
                                promises.push(
                                    t.set(
                                        db.collection('userData').doc(playerId),
                                        {
                                            ...getPlayerStats(playersCommonActivityMap[playerId], 0, 1, 0),

                                            completedMatches: firebaseAdmin.firestore.FieldValue.arrayUnion(completedMatchData),
                                        },
                                        { merge: true }
                                    )
                                );
                            });

                            promises.push(t.set(db.collection('completedMatches').doc(), completedMatchData));

                            await Promise.all(promises);
                            await t.delete(db.collection('matches').doc(matchDoc.id));
                        } else {
                            console.log('No one completed this match resetting commonActivityId.');
                            await t.update(db.collection('matches').doc(matchDoc.id), {
                                commonActivityId: null,
                            });
                        }
                    });
                }
            }
        } else {
            console.log('Match expired - setting it as such.');
            const now = Date.now();
            await db.runTransaction(async (t) => {
                const promises = [];
                const completedMatchData = {
                    ...matchData,
                    matchTime: now,
                    state: MATCH_STATE.EXPIRED,
                    stats: Object.keys(matchData.players).map((playerId) => {
                        return {
                            playerId,
                        };
                    }),
                };
                promises.push(t.set(db.collection('completedMatches').doc(), completedMatchData));

                Object.keys(matchData.players).forEach(async (playerId) => {
                    promises.push(
                        t.set(
                            db.collection('userData').doc(playerId),
                            {
                                match: null,
                                stats: {
                                    expires: firebaseAdmin.firestore.FieldValue.increment(1),
                                },
                                completedMatches: firebaseAdmin.firestore.FieldValue.arrayUnion(completedMatchData),
                            },
                            { merge: true }
                        )
                    );
                });
                promises.push(t.delete(db.collection('matches').doc(matchDoc.id)));
                await Promise.all(promises);
            });
        }
        console.log(`Time Elapsed Processing Match ${matchDoc.id}: ${Date.now() - startTime}ms`);
    } catch (err) {
        console.error(`Failed to process match: ${matchDoc.id}`, err);
    }
};

const processMatches = async (db) => {
    const startTime = Date.now();
    try {
        const matchProcessorDoc = db.collection('matchProcessor').doc('data');
        matchProcessorDoc.set({
            lastRun: startTime,
        });

        const matchesRef = db.collection('matches');
        const matchesSnapshot = await matchesRef.where('state', 'in', [MATCH_STATE.WAITING_FOR_PLAYERS, MATCH_STATE.IN_PROGRESS]).get();
        const matchProcessingPromises = [];
        matchesSnapshot.forEach(async (matchDoc) => {
            matchProcessingPromises.push(processMatch(db, matchDoc));
        });
        await Promise.all(matchProcessingPromises);
        console.log(`Time Elapsed Processing All Matches: ${Date.now() - startTime}ms`);
    } catch (err) {
        console.error(err);
        throw new functions.https.HttpsError('aborted', 'Failed to process matches.', err);
    }
    return null;
};

module.exports = { processMatches };
// Get activity history for testing
// DJK0SH3R 3 4611686018486400483 2305843009421794463
// Fishmobile 3 4611686018467485679 2305843009300307482

// setInterval(async () => {
//     const result = await getActivityHistory(3, '4611686018486400483', '2305843009421794463', 1);
//     const result2 = await getActivityHistory(3, '4611686018467485679', '2305843009300307482', 1);
//     const djActivities = result.data.Response.activities;
//     const fishActivities = result2.data.Response.activities;
//     console.log('DJ ==================> ', result.data.Response.activities[0].activityDetails, result.data.Response.activities[0].values.completed, result.data.Response.activities[0].values.completionReason, 1);
//     console.log('FISH ================> ', result.data.Response.activities[0].activityDetails, result.data.Response.activities[0].values.completed, result.data.Response.activities[0].values.completionReason, 1);

//     // console.log('DJ============================================================');
//     // djActivities.forEach((a) => {
//     //     console.log(`instanceId: ${a.activityDetails.instanceId}`);
//     //     console.log(`completed: ${JSON.stringify(a.values.completed)}`);
//     //     console.log(`completed reason: ${JSON.stringify(a.values.completionReason)}`);
//     //     console.log(`completed reason: ${JSON.stringify(a.values.kills)})`);
//     //     console.log(a.values);
//     //     console.log('----------------------------------------');
//     // });
//     // console.log('FISH============================================================');
//     // fishActivities.forEach((a) => {
//     //     console.log(`instanceId: ${a.activityDetails.instanceId}`);
//     //     console.log(`completed: ${JSON.stringify(a.values.completed)})`);
//     //     console.log(`completed reason: ${JSON.stringify(a.values.completionReason)})`);
//     //     console.log(`completed reason: ${JSON.stringify(a.values.kills)})`);
//     //     console.log(a.values);
//     //     console.log('----------------------------------------');
//     // });
// }, 3000);
