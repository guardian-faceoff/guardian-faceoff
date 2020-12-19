const axios = require('axios');
const functions = require('firebase-functions');
const { TOKEN_URL, ACTIVITY_MODES } = require('../src/Constants.json');

// const ACTIVITY_MODES_URL_STRING = Object.keys(ACTIVITY_MODES)
//     .map((key) => ACTIVITY_MODES[key])
//     .join(',');

let APP_ID;
let CLIENT_SECRET;
let API_KEY;
if (process.env.FUNCTIONS_EMULATOR === 'true') {
    APP_ID = functions.config().bungie.dev.app_id;
    CLIENT_SECRET = functions.config().bungie.dev.client_secret;
    API_KEY = functions.config().bungie.dev.api_key;
} else {
    APP_ID = functions.config().bungie.prod.app_id;
    CLIENT_SECRET = functions.config().bungie.prod.client_secret;
    API_KEY = functions.config().bungie.prod.api_key;
}

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
            client_id: APP_ID,
            code,
            client_secret: CLIENT_SECRET,
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
//             client_id: APP_ID,
//             refresh_token: refreshToken,
//             client_secret: CLIENT_SECRET,
//         }),
//     });
// };

const getMembershipInfo = async (membershipId, membershipType) => {
    return await axios.get(`https://www.bungie.net/Platform/User/GetMembershipsById/${membershipId}/${membershipType}/`, {
        headers: {
            'X-API-Key': API_KEY,
        },
    });
};

const getProfile = async (membershipType, destinyMembershipId) => {
    return await axios.get(`https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${destinyMembershipId}/?components=200`, {
        headers: {
            'X-API-Key': API_KEY,
        },
    });
};

// const getCharacter = async (membershipType, destinyMembershipId, characterId) => {
//     return await axios.get(`https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${destinyMembershipId}/Character/${characterId}/?components=102,200,201,202,204,300,301,304,400,401,402`, {
//         headers: {
//             'X-API-Key': fAPI_KEY,
//         },
//     });
// };

const getActivityHistory = async (membershipType, destinyMembershipId, characterId, numberOfMatches = 5) => {
    return await axios.get(`https://www.bungie.net/Platform/Destiny2/${membershipType}/Account/${destinyMembershipId}/Character/${characterId}/Stats/Activities/?page=0&count=${numberOfMatches}&mode=${ACTIVITY_MODES.PRIVATE_MATCHES_ALL}`, {
        headers: {
            'X-API-Key': API_KEY,
        },
    });
};

module.exports = { getTokenFromBungie, getMembershipInfo, getProfile, getActivityHistory };
