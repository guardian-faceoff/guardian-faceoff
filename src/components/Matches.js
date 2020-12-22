import React, { useContext, useEffect, useState } from 'react';
import { Grid, Paper, Box, Typography, CircularProgress, Button, Divider } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { withRouter } from 'react-router';
// import axios from 'axios';
import PropTypes from 'prop-types';
import uuid from 'uuid';
import { AppContext } from '../AppContext';
import { getCurrentMatch, getCurrentUser, getMatches, createMatch, joinMatch, cancelMatch } from '../FirebaseHelper';
import Constants from '../Constants.json';

const useStyles = makeStyles((theme) => {
    return {
        grid: {
            height: '100vh',
        },
        paper: {
            width: 'em',
            padding: theme.spacing(4),
            margin: theme.spacing(2),
            textAlign: 'left',
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
            marginTop: theme.spacing(),
            marginBottom: theme.spacing(),
        },
        title: {
            marginTop: theme.spacing(2),
            marginBottom: theme.spacing(2),
        },
        matchButton: {
            marginTop: theme.spacing(2),
            marginRight: theme.spacing(),
        },
        divider: {
            marginTop: theme.spacing(2),
            marginBottom: theme.spacing(2),
        },
        matchButtonContainer: {
            textAlign: 'left',
        },
        sectionText: {
            marginTop: theme.spacing(4),
        },
    };
});

const Matches = ({ history }) => {
    const classes = useStyles();
    const { showError } = useContext(AppContext);
    const [matchesState, setMatchesState] = useState([]);
    const [currentMatchState, setCurrentMatchState] = useState();
    const [loading, setLoading] = useState(true);

    const getListOfMatches = async () => {
        setLoading(true);
        try {
            const currentMatch = await getCurrentMatch();
            const matches = await getMatches();
            setCurrentMatchState(currentMatch);
            setMatchesState(matches.filter((match) => match.owner !== currentMatch.owner));
        } catch (e) {
            console.error(e);
            showError('Error getting list of matches.');
        }
        setLoading(false);
    };

    useEffect(() => {
        if (getCurrentUser()) {
            getListOfMatches();
        } else {
            history.push('/');
            showError('Please login.');
        }
    }, []);

    const getMatchesJsx = () => {
        if (matchesState.length > 0) {
            return matchesState.map((match) => {
                return (
                    <Paper className={classes.paper} key={uuid()}>
                        <Typography variant="h5">{`${match.players[match.owner]}'s Match`}</Typography>
                        <Typography>{`${Constants.MATCH_STATE[match.state]}`}</Typography>
                        <Divider className={classes.divider} />
                        <Box>{`Players: ${Object.keys(match.players).length}/${match.maxPlayers}`}</Box>
                        <Box>{`Expires: ${new Date(match.expires).toLocaleTimeString()} on ${new Date(match.expires).toLocaleDateString()} `}</Box>
                        <Box>
                            {`Players Joined: ${Object.keys(match.players)
                                .map((playerId) => match.players[playerId])
                                .join(', ')}`}
                        </Box>
                        <Box className={classes.matchButtonContainer}>
                            <Button
                                className={classes.matchButton}
                                color="secondary"
                                variant="contained"
                                onClick={async () => {
                                    try {
                                        await joinMatch(match.id);
                                        await getListOfMatches();
                                    } catch (e) {
                                        if (e && e.details && e.details.message) {
                                            showError(e.details.message);
                                        } else if (e && e.message) {
                                            showError(e.message);
                                        } else {
                                            showError('An error occured.');
                                        }
                                    }
                                }}
                            >
                                Join
                            </Button>
                            <Button
                                className={classes.matchButton}
                                color="secondary"
                                variant="contained"
                                onClick={async () => {
                                    try {
                                        await cancelMatch(match.id);
                                        await getListOfMatches();
                                    } catch (e) {
                                        if (e && e.details && e.details.message) {
                                            showError(e.details.message);
                                        } else if (e && e.message) {
                                            showError(e.message);
                                        } else {
                                            showError('An error occured.');
                                        }
                                    }
                                }}
                            >
                                Cancel
                            </Button>
                        </Box>
                    </Paper>
                );
            });
        }
        return (
            <Box className={classes.sectionText}>
                <Typography>No matches to join. Create one!</Typography>
            </Box>
        );
    };

    return (
        <Grid container spacing={0} align="center" direction="column" className={classes.grid}>
            <Grid item>
                <Box>
                    <Typography className={classes.title} variant="h4">
                        Matches
                    </Typography>
                    {!loading && getCurrentUser() && matchesState && (
                        <Box>
                            <Button
                                color="secondary"
                                variant="contained"
                                onClick={async () => {
                                    try {
                                        await createMatch();
                                        await getListOfMatches();
                                    } catch (e) {
                                        if (e && e.details && e.details.message) {
                                            showError(e.details.message);
                                        } else if (e && e.message) {
                                            showError(e.message);
                                        } else {
                                            showError('An error occured.');
                                        }
                                    }
                                }}
                            >
                                Create Match
                            </Button>
                        </Box>
                    )}
                    {currentMatchState && (
                        <>
                            <Typography className={classes.sectionText}>Your Current Match</Typography>
                            <Paper className={classes.paper} key={uuid()}>
                                <Typography variant="h5">{`${currentMatchState.players[currentMatchState.owner]}'s Match`}</Typography>
                                <Typography>{`${Constants.MATCH_STATE[currentMatchState.state]}`}</Typography>
                                <Divider className={classes.divider} />
                                <Box>{`Players: ${Object.keys(currentMatchState.players).length}/${currentMatchState.maxPlayers}`}</Box>
                                <Box>{`Expires: ${new Date(currentMatchState.expires).toLocaleTimeString()} on ${new Date(currentMatchState.expires).toLocaleDateString()} `}</Box>
                                <Box>
                                    {`Players Joined: ${Object.keys(currentMatchState.players)
                                        .map((playerId) => currentMatchState.players[playerId])
                                        .join(', ')}`}
                                </Box>
                                <Box className={classes.matchButtonContainer}>
                                    <Button
                                        className={classes.matchButton}
                                        color="secondary"
                                        variant="contained"
                                        onClick={async () => {
                                            try {
                                                await joinMatch(currentMatchState.id);
                                                await getListOfMatches();
                                            } catch (e) {
                                                if (e && e.details && e.details.message) {
                                                    showError(e.details.message);
                                                } else if (e && e.message) {
                                                    showError(e.message);
                                                } else {
                                                    showError('An error occured.');
                                                }
                                            }
                                        }}
                                    >
                                        Join
                                    </Button>
                                    <Button
                                        className={classes.matchButton}
                                        color="secondary"
                                        variant="contained"
                                        onClick={async () => {
                                            try {
                                                await cancelMatch(currentMatchState.id);
                                                await getListOfMatches();
                                            } catch (e) {
                                                if (e && e.details && e.details.message) {
                                                    showError(e.details.message);
                                                } else if (e && e.message) {
                                                    showError(e.message);
                                                } else {
                                                    showError('An error occured.');
                                                }
                                            }
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </Box>
                            </Paper>
                        </>
                    )}
                    <Typography className={classes.sectionText}>Available Matches</Typography>
                    {!loading && getCurrentUser() && matchesState && <Box>{getMatchesJsx()}</Box>}
                    {loading && <CircularProgress color="secondary" />}
                </Box>
            </Grid>
        </Grid>
    );
};

Matches.propTypes = {
    history: PropTypes.object,
};

export default withRouter(Matches);
