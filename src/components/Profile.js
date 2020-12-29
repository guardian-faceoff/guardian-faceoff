import React, { useContext, useEffect, useState } from 'react';
import { Grid, Paper, Box, CircularProgress, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { withRouter } from 'react-router';
import PropTypes from 'prop-types';
import axios from 'axios';
import { AppContext } from '../AppContext';
import { getCurrentUser, getCurrentUserData } from '../FirebaseHelper';
import Constants from '../Constants.json';

const useStyles = makeStyles((theme) => {
    return {
        grid: {
            height: '100vh',
        },
        paper: {
            width: '37em',
            padding: theme.spacing(4),
            margin: theme.spacing(2),
            [theme.breakpoints.down('xs')]: {
                width: `calc(100% - ${theme.spacing(4)}px)`,
            },
        },
        button: {
            marginTop: theme.spacing(4),
            marginBottom: theme.spacing(2),
        },
        input: {
            width: `calc(100% - ${theme.spacing(2)}px)`,
            margin: theme.spacing(),
        },
        profilePic: {
            width: 100,
            height: 100,
            margin: theme.spacing(),
        },
        membershipIcon: {
            width: 25,
            height: 25,
            margin: theme.spacing(),
        },
        title: {
            margin: theme.spacing(2),
        },
    };
});

const Profile = ({ history }) => {
    const classes = useStyles();
    const [userState, setUserState] = useState();
    const [statsState, setStatsState] = useState();
    const [userLoading, setUserLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const { showError, BUNGIE_API_KEY } = useContext(AppContext);

    const getUserData = async () => {
        try {
            const userDoc = await getCurrentUserData();
            setUserState(userDoc.data());
        } catch (e) {
            console.error(e);
            showError('Error getting profile data for user.');
        }
        setUserLoading(false);
    };

    const getUserStats = async () => {
        try {
            const userDoc = await getCurrentUserData();
            const userData = userDoc.data();
            const { membershipType, membershipId } = userData.membership;
            const { data } = await axios.get(`https://www.bungie.net/Platform/Destiny2/${membershipType}/Account/${membershipId}/Stats/`, {
                headers: {
                    'X-API-Key': BUNGIE_API_KEY,
                },
            });
            setStatsState(data.Response.mergedAllCharacters.results.allPvP.allTime);
        } catch (e) {
            console.error(e);
            showError('Error getting stats data for user.');
        }
        setStatsLoading(false);
    };

    useEffect(() => {
        if (getCurrentUser()) {
            getUserData();
            getUserStats();
        } else {
            history.push('/');
            showError('Please login.');
        }
    }, []);

    return (
        <Grid container spacing={0} align="center" direction="column" className={classes.grid}>
            <Grid item>
                <Paper className={classes.paper}>
                    {!userLoading && getCurrentUser() && userState && (
                        <Box>
                            <Typography className={classes.title} variant="h4">{`${getCurrentUser().displayName}`}</Typography>
                            <img className={classes.profilePic} alt="profile" src={getCurrentUser().photoURL} />
                            <Box>You are currently set to play on:</Box>
                            <Box>{Constants.MEMBERSHIP_TYPES[userState.membership.membershipType]}</Box>
                            <img className={classes.membershipIcon} alt="current-membership" src={userState.membership.iconURL} />
                        </Box>
                    )}
                    {userLoading && (
                        <Box>
                            <CircularProgress color="secondary" />
                        </Box>
                    )}
                    {!statsLoading && getCurrentUser() && userState && (
                        <Box>
                            <Typography className={classes.title} variant="h5">
                                Guardian Faceoff Stats:
                            </Typography>
                            {userState.stats && (
                                <>
                                    <Box>{`Wins: ${userState.stats.wins || 0}`}</Box>
                                    <Box>{`Ties: ${userState.stats.ties || 0}`}</Box>
                                    <Box>{`Losses: ${userState.stats.losses || 0}`}</Box>
                                    <Box>{`Score: ${userState.stats.score || 0}`}</Box>
                                    <Box>{`Kills: ${userState.stats.kills || 0}`}</Box>
                                    <Box>{`Deaths: ${userState.stats.deaths || 0}`}</Box>
                                    <Box>{`Assists: ${userState.stats.assists || 0}`}</Box>
                                    {userState.stats.kills && userState.stats.deaths && <Box>{`K/D Ratio: ${Math.round(((userState.stats.kills / userState.stats.deaths) * 100) / 100)}`}</Box>}
                                </>
                            )}
                            {!userState.stats && <Box>No stats to display yet - play some matches!</Box>}
                        </Box>
                    )}
                    {!statsLoading && getCurrentUser() && statsState && (
                        <Box>
                            <Typography className={classes.title} variant="h5">
                                Destiny 2 Stats:
                            </Typography>
                            <Box>{`KD/A: ${statsState.killsDeathsAssists.basic.displayValue}`}</Box>
                            <Box>{`Most Kills in a Game: ${statsState.bestSingleGameKills.basic.displayValue}`}</Box>
                            <Box>{`Most Kills in a Life: ${statsState.longestKillSpree.basic.displayValue}`}</Box>
                        </Box>
                    )}
                    {statsLoading && (
                        <Box>
                            <CircularProgress color="secondary" />
                        </Box>
                    )}
                </Paper>
            </Grid>
        </Grid>
    );
};

Profile.propTypes = {
    history: PropTypes.object,
};

export default withRouter(Profile);
