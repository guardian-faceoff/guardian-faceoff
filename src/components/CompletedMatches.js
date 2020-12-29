import React, { useContext, useEffect, useState } from 'react';
import { Grid, Paper, Box, Typography, CircularProgress, TableContainer, Table, TableCell, TableRow, TableBody, TableHead } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { withRouter } from 'react-router';
// import axios from 'axios';
import PropTypes from 'prop-types';
import uuid from 'uuid';
import StarIcon from '@material-ui/icons/Star';
import { AppContext } from '../AppContext';
import { getCurrentUser, getCompletedMatches } from '../FirebaseHelper';
import Constants from '../Constants.json';

const useStyles = makeStyles((theme) => {
    return {
        grid: {
            height: '100vh',
        },
        paper: {
            width: '45em',
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
        table: {
            marginTop: theme.spacing(),
            background: theme.palette.primary.dark,
            color: theme.palette.primary.contrastText,
        },
        wrapIcon: {
            verticalAlign: 'middle',
            display: 'inline-flex',
            horizontalAlign: 'middle',
        },
        star: {
            height: '0.8em',
            marginTop: '0.15em',
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
                    <Typography variant="h5">{`${match.players[match.owner]}'s Match`}</Typography>
                    <Typography>{`${Constants.MATCH_STATE[match.state]}`}</Typography>
                    <Box>{`on ${new Date(match.expires).toLocaleDateString()} at ${new Date(match.expires).toLocaleTimeString()}`}</Box>
                    <Box>
                        <TableContainer component={Paper}>
                            <Table className={classes.table} size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Player</TableCell>
                                        <TableCell align="center">Score</TableCell>
                                        <TableCell align="center">Kills</TableCell>
                                        <TableCell align="center">Deaths</TableCell>
                                        <TableCell align="center">Assists</TableCell>
                                        <TableCell align="center">Completed</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {match.stats.map((row) => (
                                        <TableRow key={row.playerId}>
                                            <TableCell component="th" scope="row">
                                                <Typography variant="subtitle1" className={classes.wrapIcon}>
                                                    {match.players[row.playerId]}
                                                    {match.winners && match.winners.indexOf(row.playerId) > -1 && <StarIcon className={classes.star} />}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">{row.score ? row.score : '-'}</TableCell>
                                            <TableCell align="center">{row.kills ? row.kills : '-'}</TableCell>
                                            <TableCell align="center">{row.deaths ? row.deaths : '-'}</TableCell>
                                            <TableCell align="center">{row.assists ? row.assists : '-'}</TableCell>
                                            {row.completed !== undefined ? <TableCell align="center">{row.completed === true ? 'Yes' : 'No'}</TableCell> : <TableCell align="center">-</TableCell>}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
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
                    {!loading && getCurrentUser() && !completedMatchesState && <Box>No completed matches to display.</Box>}
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
