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
            width: 150,
            height: 150,
            margin: theme.spacing(),
        },
        membershipIcon: {
            width: 50,
            height: 50,
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
            // console.log(data.Response.mergedAllCharacters.results.allPvP.allTime);
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
                            <Typography className={classes.title} variant="h4">{`Welcome back ${getCurrentUser().displayName}!`}</Typography>
                            <img className={classes.profilePic} alt="profile" src={getCurrentUser().photoURL} />
                            <Box>{`You are currently set to play on: ${Constants.MEMBERSHIP_TYPES[userState.membership.membershipType]}`}</Box>
                            <img className={classes.membershipIcon} alt="current-membership" src={userState.membership.iconURL} />
                        </Box>
                    )}
                    {userLoading && (
                        <Box>
                            <CircularProgress color="secondary" />
                        </Box>
                    )}
                    {!statsLoading && getCurrentUser() && statsState && (
                        <Box>
                            <Typography className={classes.title} variant="h4">
                                Stats:
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
