require('webtask-require-version')
const repeatone = require('./repeatone')
const {API_KEY, LASTFM_USER} = process.env

repeatone({data: {API_KEY, user: LASTFM_USER || 'formatfanatic'}}, console.log.bind(console))
