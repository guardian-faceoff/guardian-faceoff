import React, { useContext, useState, useEffect } from 'react';
import { Typography } from '@material-ui/core';
import { watchDoc } from '../FirebaseHelper';
import { AppContext } from '../AppContext';
import { MATCH_PROCCESSING_INTERVAL } from '../Constants.json';

const msToMinutesAndSeconds = (millis) => {
    let minutes = Math.floor(millis / 60000);
    let seconds = ((millis % 60000) / 1000).toFixed(0);
    if (seconds === '60') {
        minutes += 1;
        seconds = '0';
    }
    return `${minutes} minutes and ${seconds} seconds`;
};

export const MatchProcessCountdown = () => {
    const [matchProcessorData, setMatchProcessorData] = useState();
    const { showError } = useContext(AppContext);
    const [, updateState] = React.useState();
    const forceUpdate = React.useCallback(() => updateState({}), []);

    const getAndWatchMatchProcessorData = async () => {
        watchDoc(
            'matchProcessor',
            'data',
            (matchProcessorDataIncoming) => {
                setMatchProcessorData(matchProcessorDataIncoming);
            },
            (e) => {
                console.error(e);
                showError('Error getting match processor data.');
            }
        );
    };

    useEffect(() => {
        getAndWatchMatchProcessorData();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            forceUpdate();
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    let matchProcessMessage;
    if (matchProcessorData) {
        const nextRun = matchProcessorData.lastRun + MATCH_PROCCESSING_INTERVAL;
        if (Date.now() < nextRun) {
            matchProcessMessage = `in ${msToMinutesAndSeconds(nextRun - Date.now())}`;
        } else {
            matchProcessMessage = 'soon...';
        }
    } else {
        matchProcessMessage = 'soon...';
    }

    return <Typography variant="overline">{`Processing matches ${matchProcessMessage}`}</Typography>;
};
