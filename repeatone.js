'use latest'

const request = require('request')
const qs = require('qs')
const _ = require('lodash')
const async = require('async')
const Buffer = require('safe-buffer').Buffer
const log = console.log.bind(console)

const URI_BASE = 'http://ws.audioscrobbler.com/2.0/?'
const DEFAULT_PARAMS = {
  format: 'json',
  limit: 5,
  method: 'user.getrecenttracks'
}

const getTrackId = (track) =>
  track.mbid || track.url || `${track.name}-${track.artist['#text']}`

const getTrackDesc = (track) =>
  `${track.artist['#text']} ${track.name}`.replace(/\s+/g, ' ')

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

const getLargestImage = (track) => {
  const {image} = track
  return (_.find(image, {size: 'extralarge'}) ||
    _.find(image, {size: 'large'}) ||
    _.find(image, {size: 'medium'}) ||
    _.find(image, {size: 'small'}) || {})['#text']
}

const toBase64 = (h, b) => {
  return `data:${h['content-type']};base64,${Buffer.from(b).toString('base64')}`
}

const fetchBase64Image = (uri, cb) => {
  request({uri, encoding: null}, (error, resp, body) => {
    if (error || resp.statusCode !== 200) {
      cb(new Error('No image'))
    } else {
      cb(null, toBase64(resp.headers, body))
    }
  })
}

const fetchItunesImage = (track, cb) => {
  const trackDesc = getTrackDesc(track)
  const url = `https://itunes.apple.com/search?media=music&term=${trackDesc.replace(/ /g, '+')}`

  log(`Fetching iTunes image ${trackDesc} ${url}`)

  request(url, (err, resp, body) => {
    if (err || resp.statusCode !== 200) {
      return cb(new Error('Error fetching from iTunes'))
    }

    const data = JSON.parse(body)

    if (!data || data.resultCount === 0 || !data.results) {
      return cb(new Error('No results'))
    }

    const [track] = data.results || []
    const image = track && track.artworkUrl100

    if (!image) {
      return cb(new Error('No image'))
    }

    fetchBase64Image(image.replace('.100x100-', '.300x300-'), cb)
  })
}

module.exports = (ctx, cb) => {
  const {data} = ctx
  const {API_KEY, user} = data

  if (!user) {
    return cb(new Error(`You must specify a user`))
  }

  log(`Requesting user ${user}`)

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
    log(`Fetching page ${page + 1}`)

    request(fetchUrl + `&page=${++page}`, (__, ___, body) => {
      const data = JSON.parse(body)

      if (data.error) {
        return requestCb(new Error(`${data.error}: ${data.message}`))
      }

      const tracks = data.recenttracks.track
      track = track || _.first(tracks)

      if (!track) {
        log(`No track`)

        // If for some reason there are no tracks then we are already done
        isRepeating = false
      } else {
        log(`Fetched ${tracks.length} tracks`)

        for (let i = 0, m = tracks.length; i < m; i++) {
          if (getTrackId(tracks[i]) === getTrackId(track)) {
            log(`Tracks match at ${i} index`)

            // Increment count and collect track if the tracks are the same
            repeats.push(tracks[i])
            count++
          } else {
            log(`Tracks dont match at ${i} index`)

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
        log(err)
        return cb(err)
      } else if (!count) {
        log('No count')
        return cb(null, {user: _.escape(user), count: null, track: null})
      } else {
        const mergedTrack = mergeTracks(repeats)
        const values = {count, user: _.escape(user), track: mergedTrack}
        const uri = getLargestImage(values.track)
        const returnWithImage = (err, base64, imageSource) => {
          log(`Fetched ${imageSource} image: ${base64 ? 'success' : err.message}`)
          cb(null, _.assign({base64, imageSource}, values))
        }

        if (uri) {
          log(`Fetching lastfm image ${uri}`)
          fetchBase64Image(uri, (err, base64) => returnWithImage(err, base64, 'lastfm'))
        } else {
          fetchItunesImage(mergedTrack, (err, base64) => returnWithImage(err, base64, 'itunes'))
        }
      }
    }
  )
}
