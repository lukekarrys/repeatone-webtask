require('webtask-require-version')
const repeatone = require('./repeatone')
const {API_KEY, LASTFM_USER} = process.env

repeatone({data: {API_KEY, user: LASTFM_USER || 'formatfanatic'}}, (err, data) => {
  console.log('Error', err)
  if (data) {
    data.base64 = !!data.base64
    console.log(JSON.stringify(data, null, 2))
  }
})
