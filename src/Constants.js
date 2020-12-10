const { VERSION } = window.RESOURCES;
const { BUNGIE_APP_ID } = window.RESOURCES;
const { BUNGIE_API_KEY } = window.RESOURCES;

const TOKEN_URL = 'https://www.bungie.net/Platform/App/OAuth/token/';

const LOCALE = {
    all: 'All Locations',
    edz: 'EDZ',
    luna: 'Luna',
    europa: 'Europa',
    dreaming_city: 'Dreaming City',
    cosmodrome: 'Cosmodrome',
    nessus: 'Nessus',
    tangled_shore: 'Tangled Shore',
    raid: 'Raid',
    crucible: 'Crucible',
    gambit: 'Gambit',
    strike: 'Strike',
    patrol: 'Patrol',
    lost_sector: 'Lost Sector',
    trials: 'Trials',
};

export { VERSION, LOCALE, BUNGIE_APP_ID, BUNGIE_API_KEY, TOKEN_URL };
