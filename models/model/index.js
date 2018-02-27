'use strict'

const EventEmitter = require('events').EventEmitter

class Model extends EventEmitter {

  constructor (parent, options) {

    if (!(parent instanceof EventEmitter || parent === null)) {
      throw new TypeError(`parent must be an instance of EventEmitter or null (self)`)
    }

    if (!(options instanceof Object)) {
      throw new TypeError(`argument options must be an object`)
    }

    super()
    this.init(parent, options)
  }

  init (parent, options) {
    if (parent !== null) {
      return this.parent = parent
    }

    /**
     * @object this
     * @property {boolean|void} debug - process debug state
     * @property {boolean} isReady - process ready state
     * @property {object} conditions - all instances conditions
     * */

    this.parent = this // need for debug only
    this._debug = !!options.debug

    /*
     * * * * * * * * * * * * * STATE CHANGE EVENTS
     * * * * * * * * * * * * * ready            - once after establish all connections and ready servers
     * * * * * * * * * * * * * stateChange      - this.isReady = !this.isReady (on isReady change)
     * * * * * * * * * * * * * conditionsChange - one of instances condition has been changed
     * */

    this.conditions = {}
    this.isReady = true
    this.wasCalledReadyEvent = false
    this.checkState = checkState.bind(this)
    this.setCondition = setCondition.bind(this)
    this.getCondition = getCondition.bind(this)
  }

  debug (...args) {
    if (this.parent._debug) {
      console.log(this.type || '', ...args)
    }
  }
}

module.exports = Model

/**
 * @function checkState
 * @description check all services are ready, emit stateChange event if this.isReady to not equal new state
 * @returns {boolean}
 * */

function checkState () {

  for (let entity in this.conditions) {
    for (let type in this.conditions[entity]) {
      if (!this.getCondition(entity, type)) {

        // if parent has state === true we need to change it
        // because one of his child services is not ready
        if (this.isReady) {
          this.emit('stateChange', this.isReady = false)
        }

        return this.isReady
      }
    }
  }

  // if parent has isReady === false we need to change it
  // because all of his child services are ready again
  if (!this.isReady) {
    this.emit('stateChange', this.isReady = true)
    if (!this.wasCalledReadyEvent) {
      this.wasCalledReadyEvent = true
      this.emit('ready')
    }
  }

  return this.isReady
}

/**
 * @function setCondition
 * @description update single services condition
 * @returns {void}
 * */

function setCondition (entity, type, val = false) {
  this.conditions[entity] = this.conditions[entity] || {}

  if (this.conditions[entity][type] !== val) {
    this.conditions[entity][type] = val
    this.emit('conditionsChange', entity, type, val)
    this.checkState()
  }
}

/**
 * @function setCondition
 * @description check single services condition
 * @returns {boolean}
 * */

function getCondition (entity, type) {
  if (this.conditions[entity] instanceof Object) {
    return this.conditions[entity][type]
  }

  return false
}
