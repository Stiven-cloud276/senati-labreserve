import test from 'node:test'
import assert from 'node:assert/strict'
import { authenticate, issueToken, requireRole } from '../src/middlewares/auth.js'

process.env.AUTH_TOKEN_SECRET = 'test-secret-with-more-than-thirty-two-characters'

const user = {
  id: 7,
  correo: 'usuario@example.com',
  role: 'usuario',
}

function authenticateToken(token) {
  const request = { get: () => token ? `Bearer ${token}` : undefined }
  let forwardedError
  authenticate(request, {}, (error) => { forwardedError = error })
  return { request, error: forwardedError }
}

test('rejects requests without a bearer token', () => {
  const { error } = authenticateToken('')
  assert.equal(error.status, 401)
})

test('accepts a valid token and attaches its account identity', () => {
  const { request, error } = authenticateToken(issueToken(user))
  assert.equal(error, undefined)
  assert.deepEqual(request.user, user)
})

test('rejects an invalid bearer token', () => {
  const { error } = authenticateToken('invalid-token')
  assert.equal(error.status, 401)
})

test('rejects tokens without a valid account id', () => {
  const { error } = authenticateToken(issueToken({ ...user, id: 0 }))
  assert.equal(error.status, 401)
})

test('restricts laboratory administration to admins', () => {
  let userError
  requireRole('admin')({ user }, {}, (error) => { userError = error })
  assert.equal(userError.status, 403)

  let adminContinued = false
  requireRole('admin')({ user: { ...user, role: 'admin' } }, {}, (error) => {
    assert.equal(error, undefined)
    adminContinued = true
  })
  assert.equal(adminContinued, true)
})
