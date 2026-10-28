import test from 'node:test'
import assert from 'node:assert/strict'
import { writeAccess } from '../src/middlewares/writeAccess.js'

test('requires a valid key for production writes', () => {
  const previousEnvironment = process.env.NODE_ENV
  const previousKey = process.env.API_WRITE_KEY
  process.env.NODE_ENV = 'production'
  process.env.API_WRITE_KEY = 'test-secret'

  try {
    let forwardedError
    writeAccess({ get: () => 'wrong-secret' }, {}, (error) => { forwardedError = error })
    assert.equal(forwardedError.status, 401)

    let continued = false
    writeAccess({ get: () => 'test-secret' }, {}, (error) => {
      assert.equal(error, undefined)
      continued = true
    })
    assert.equal(continued, true)
  } finally {
    if (previousEnvironment === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = previousEnvironment
    if (previousKey === undefined) delete process.env.API_WRITE_KEY
    else process.env.API_WRITE_KEY = previousKey
  }
})
