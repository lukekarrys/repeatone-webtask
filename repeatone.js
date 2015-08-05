'use latest'

const request = require('request@2.56.0')
const qs = require('qs@3.1.0')
const _ = require('lodash@3.9.3')

const URI_BASE = 'http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&'
const DEFAULT_PARAMS = {
  user: 'formatfanatic',
  limit: 200,
  format: 'json'
}

module.exports = (ctx, cb) => {
  const {data} = ctx

  const params = _.assign({api_key: data.API_KEY}, DEFAULT_PARAMS, _.omit(data, 'API_KEY'))
  const fetchUrl = `${URI_BASE}${qs.stringify(params)}`

  request(fetchUrl, (__, ___, body) => {
    const jsonBody = JSON.parse(body)
    if (jsonBody.error) {
      return cb(new Error(`${jsonBody.error}: ${jsonBody.message}`))
    }

    let count = 0
    const tracks = jsonBody.recenttracks.track
    const track = _.first(tracks) || null
    const ids = _.pluck(tracks, 'mbid')

    if (track) {
      for (let i = 0, m = ids.length; i < m; i++) {
        if (ids[i] === track.mbid) {
          count++
        } else {
          break
        }
      }
    }

    cb(null, count <= 1 ? {count: null, track: null} : {count, track})
  })
}
