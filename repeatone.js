'use latest'

const request = require('request@2.56.0')
const qs = require('qs@3.1.0')
const _ = require('lodash@3.9.3')
const async = require('async@1.0.0')

const URI_BASE = 'http://ws.audioscrobbler.com/2.0/?'
const DEFAULT_PARAMS = {
  format: 'json',
  limit: 5,
  method: 'user.getrecenttracks'
}

const getTrackId = (track) =>
  track.mbid || track.url || `${track.name}-${track.artist['#text']}`

const mergeTracks = (tracks) => _.reduce(tracks, (res, track) => {
  if (res === null) {
    return track
  } else {
    if (_.filter(res.image, '#text').length === 0) {
      res.image = track.image
    }
    return res
  }
}, null)

module.exports = (ctx, cb) => {
  const {data} = ctx
  const {API_KEY} = data
  const user = _.escape(data.user)

  if (!user) {
    return cb(new Error(`You must specify a user`))
  }

  const params = _.assign({user, api_key: API_KEY}, DEFAULT_PARAMS)
  const fetchUrl = `${URI_BASE}${qs.stringify(params)}`

  // We need these as part of our request iterator and our final callback
  let page = 0
  let count = 0
  let track = null
  let repeats = []
  let isRepeating = true

  const testRepeating = () => isRepeating
  const requestTracks = (requestCb) => {
    request(fetchUrl + `&page=${++page}`, (__, ___, body) => {
      const data = JSON.parse(body)

      if (data.error) {
        return requestCb(new Error(`${data.error}: ${data.message}`))
      }

      const tracks = data.recenttracks.track
      track = track || _.first(tracks)

      if (!track) {
        // If for some reason there are no tracks then we are already done
        isRepeating = false
      } else {
        for (let i = 0, m = tracks.length; i < m; i++) {
          if (getTrackId(tracks[i]) === getTrackId(track)) {
            // Increment count and collect track if the tracks are the same
            repeats.push(tracks[i])
            count++
          } else {
            // The next track is not the same id as the first track so
            // we are done with out whilst loop
            isRepeating = false
            break
          }
        }
      }

      requestCb()
    })
  }

  // This is done in an async while loop because the alternative is fetching
  // the max limit from lastfm (200) but that takes quite a bit of time to return.
  // So to optimize for the case of <200 repeat listens (which is probably every case)
  // we fetch 5 at a time and analyze in chunks.
  async.whilst(
    testRepeating,
    requestTracks,
    (err) => {
      if (err) {
        return cb(err)
      } else {
        // We only care about repeating so if the count is 1 its not repeating
        // and we return nulls
        cb(null, count <= 1 ? {user, count: null, track: null} : {user, count, track: mergeTracks(repeats)})
      }
    }
  )
}
