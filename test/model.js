'use strict'

const assert = require('assert')
const EventEmitter = require('events').EventEmitter
const Model = require('../models/model')

describe('Model', () => {
  const model = new Model(null, {})

  it('must be an EventEmitter instance', () => {
    assert.equal(model instanceof EventEmitter, true)
  })

  it('must be an object', () => {
    assert.equal(model instanceof Object, true)
  })

  it('must be a Model instance', () => {
    assert.equal(model instanceof Model, true)
  })

  it('must have a circle link', () => {
    assert.equal(model.parent instanceof Model, true)
  })
})