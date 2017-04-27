const test = require('tape')
const dotenv = require('dotenv')

dotenv.config()
const repeatOne = require('./repeatone')

const user = 'formatfanatic'
const {API_KEY, COUNT, NAME, ARTIST} = process.env

test('Errors without a token', (t) => {
  repeatOne({data: {user}}, (err, count) => {
    t.ok(err, 'has an error')
    t.ok(err instanceof Error, 'is an instance of error')
    t.equal(err.message, '6: Invalid parameters - Your request is missing a required parameter')
    t.notOk(count, 'has no count')
    t.end()
  })
})

test('Errors without a user', (t) => {
  repeatOne({data: {}}, (err, count) => {
    t.ok(err, 'has an error')
    t.ok(err instanceof Error, 'is an instance of error')
    t.equal(err.message, 'You must specify a user')
    t.notOk(count, 'has no count')
    t.end()
  })
})

if (API_KEY) {
  test('Returns data with a token', (t) => {
    repeatOne({data: {API_KEY, user}}, (err, data) => {
      t.notOk(err, 'no error')

      t.equal(data.user, user, 'returns the same user')
      t.equal(typeof data.count, 'number', 'count is a number')
      t.ok(typeof data.track === 'object', 'track is an object')
      t.ok(data.track.image[0]['#text'], 'first image exists')

      if (COUNT) {
        t.ok(typeof data.count === 'number', 'count is a number')
        t.equal(data.count, parseInt(COUNT, 10), 'count is equal')
      }

      if (NAME || ARTIST) {
        NAME && t.equal(data.track.name, NAME, 'track name')
        ARTIST && t.equal(data.track.artist['#text'], ARTIST, 'artist name')
      }

      t.end()
    })
  })
}
