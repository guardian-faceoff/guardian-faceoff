let bungieJson;
if (process.env.NODE_ENV === 'development') {
    try {
        // eslint-disable-next-line global-require
        bungieJson = require('../bungie-dev.json');
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Error Loading bungie-dev.json. Does this file exist?');
        process.exit(1337);
    }
} else {
    // eslint-disable-next-line global-require
    bungieJson = require('../bungie.json');
}

module.exports = bungieJson;
