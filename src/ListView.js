import React, { useState, useEffect } from "react";
import { withRouter } from "react-router-dom";
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => {
    return {};
});


const ListView = ({ logout, match, history }) => {
    // const classes = useStyles();
    // const [ state, setState ] = useState({});
    return (
        <>
            <Card>ListView</Card>
        </>
    );
};

export default withRouter(ListView);