const axios = require('axios');
const functions = require('firebase-functions');
const { TOKEN_URL, ACTIVITY_MODES } = require('../src/Constants.json');

// const ACTIVITY_MODES_URL_STRING = Object.keys(ACTIVITY_MODES)
//     .map((key) => ACTIVITY_MODES[key])
//     .join(',');

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

// const refreshTokenFromBungie = async (refreshToken) => {
//     return await axios({
//         url: TOKEN_URL,
//         method: 'post',
//         headers: {
//             'Content-Type': 'application/x-www-form-urlencoded',
//         },
//         data: createFormParams({
//             grant_type: 'refresh_token',
//             client_id: functions.config().bungie.app_id,
//             refresh_token: refreshToken,
//             client_secret: functions.config().bungie.client_secret,
//         }),
//     });
// };

const getMembershipInfo = async (membershipId, membershipType) => {
    return await axios.get(`https://www.bungie.net/Platform/User/GetMembershipsById/${membershipId}/${membershipType}/`, {
        headers: {
            'X-API-Key': functions.config().bungie.api_key,
        },
    });
};

const getProfile = async (membershipType, destinyMembershipId) => {
    return await axios.get(`https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${destinyMembershipId}/?components=200`, {
        headers: {
            'X-API-Key': functions.config().bungie.api_key,
        },
    });
};

// const getCharacter = async (membershipType, destinyMembershipId, characterId) => {
//     return await axios.get(`https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${destinyMembershipId}/Character/${characterId}/?components=102,200,201,202,204,300,301,304,400,401,402`, {
//         headers: {
//             'X-API-Key': functions.config().bungie.api_key,
//         },
//     });
// };

const getActivityHistory = async (membershipType, destinyMembershipId, characterId) => {
    return await axios.get(`https://www.bungie.net/Platform/Destiny2/${membershipType}/Account/${destinyMembershipId}/Character/${characterId}/Stats/Activities/?page=0&count=5&mode=${ACTIVITY_MODES.ALL_PVP}`, {
        headers: {
            'X-API-Key': functions.config().bungie.api_key,
        },
    });
};

module.exports = { getTokenFromBungie, getMembershipInfo, getProfile, getActivityHistory };
