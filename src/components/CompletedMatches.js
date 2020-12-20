import React, { useContext, useEffect, useState } from 'react';
import { Grid, Paper, Box, Typography, CircularProgress, Divider } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { withRouter } from 'react-router';
// import axios from 'axios';
import PropTypes from 'prop-types';
import uuid from 'uuid';
import { AppContext } from '../AppContext';
import { getCurrentUser, getCompletedMatches } from '../FirebaseHelper';
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
    };
});

const CompletedMatches = ({ history }) => {
    const classes = useStyles();
    const { showError } = useContext(AppContext);
    const [completedMatchesState, setCompletedMatchesState] = useState([]);
    const [loading, setLoading] = useState(true);

    const getListOfMatches = async () => {
        setLoading(true);
        try {
            const completedMatches = await getCompletedMatches();
            setCompletedMatchesState(completedMatches);
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
        return completedMatchesState.map((match) => {
            return (
                <Paper className={classes.paper} key={uuid()}>
                    <Typography variant="h5">{`${match.ownerDisplayName}'s Match`}</Typography>
                    <Typography>{`${Constants.MATCH_STATE[match.state]}`}</Typography>
                    <Divider className={classes.divider} />
                    <Box>{`Players: ${Object.keys(match.players).length}/${match.maxPlayers}`}</Box>
                    <Box>{`Expires: ${new Date(match.expires).toLocaleTimeString()} on ${new Date(match.expires).toLocaleDateString()} `}</Box>
                    <Box>
                        {`Players Joined: ${Object.keys(match.players)
                            .map((playerId) => match.players[playerId])
                            .join(', ')}`}
                    </Box>
                </Paper>
            );
        });
    };

    return (
        <Grid container spacing={0} align="center" direction="column" className={classes.grid}>
            <Grid item>
                <Box>
                    <Typography className={classes.title} variant="h4">
                        Completed Matches
                    </Typography>
                    {!loading && getCurrentUser() && completedMatchesState && <Box>{getMatchesJsx()}</Box>}
                    {loading && <CircularProgress color="secondary" />}
                </Box>
            </Grid>
        </Grid>
    );
};

CompletedMatches.propTypes = {
    history: PropTypes.object,
};

export default withRouter(CompletedMatches);
