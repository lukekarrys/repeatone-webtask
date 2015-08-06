import test from 'tape'

// Override default require to allow for @x.y.z syntax
// Also, webtask needs to use 'require' here instead of ES6
// import because of babel (I think)
require('webtask-require-version')
const repeatOne = require('./repeatone')

const {API_KEY, COUNT, NAME, ARTIST} = process.env

test('Errors without a token', (t) => {
  repeatOne({data: {}}, (err, count) => {
    t.ok(err, 'has an error')
    t.ok(err instanceof Error, 'is an instance of error')
    t.equal(err.message, '10: Invalid API key - You must be granted a valid key by last.fm')
    t.notOk(count, 'has no count')
    t.end()
  })
})

if (API_KEY) {
  test('Returns data with a token', (t) => {
    repeatOne({data: {API_KEY}}, (err, data) => {
      t.notOk(err, ' no error')

      if (COUNT) {
        t.ok(typeof data.count === 'number', 'count is a number')
        t.equal(data.count, parseInt(COUNT, 10), 'count is equal')
      } else {
        t.equal(data.count, null, 'count is null')
      }

      if (NAME || ARTIST) {
        t.ok(typeof data.track === 'object', 'track is an object')
        NAME && t.equal(data.track.name, NAME, 'track name')
        ARTIST && t.equal(data.track.artist['#text'], ARTIST, 'artist name')
      } else {
        t.equal(data.track, null, 'track is null')
      }

      t.end()
    })
  })
}
