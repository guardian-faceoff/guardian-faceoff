const axios = require('axios');
const functions = require('firebase-functions');
const { TOKEN_URL } = require('../src/Constants.json');

const createFormParams = (params) =>
    Object.keys(params)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');

const getTokenFromBungie = async (code) => {
    return await axios({
        url: TOKEN_URL,
        method: 'post',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: createFormParams({
            grant_type: 'authorization_code',
            client_id: functions.config().bungie.app_id,
            code,
            client_secret: functions.config().bungie.client_secret,
        }),
    });
};

const refreshTokenFromBungie = async (refreshToken) => {
    return await axios({
        url: TOKEN_URL,
        method: 'post',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: createFormParams({
            grant_type: 'refresh_token',
            client_id: functions.config().bungie.app_id,
            refresh_token: refreshToken,
            client_secret: functions.config().bungie.client_secret,
        }),
    });
};

const getMembershipInfo = async (accessToken) => {
    return await axios.get('https://www.bungie.net/Platform/User/GetMembershipsForCurrentUser/', {
        headers: {
            'X-API-Key': functions.config().bungie.api_key,
            Authorization: `Bearer ${accessToken}`,
        },
    });
};

module.exports = { getTokenFromBungie, refreshTokenFromBungie, getMembershipInfo };
