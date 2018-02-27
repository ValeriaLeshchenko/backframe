'use strict'

const net = require('net')
const OutboundConnectionQueue = require('../outboundConnectionQueue')
const NetLayer = require('../netLayer')
const { isValidMessage, packAuth } = require('../../lib')
const { frame } = require('frame-net')

const sendMarker = Buffer.alloc(1)
const notifyMarker = Buffer.alloc(1)
const fetchMarker = Buffer.alloc(1)
notifyMarker.writeUInt8(1, 0)
fetchMarker.writeUInt8(2, 0)

class Connection extends NetLayer {

  constructor (parent, options) {
    super(parent, options)

    this.type = options.type // connection identifier
    this.fetchTimeout = options.fetchTimeout || 300
    this.reconnectTimeout = options.reconnectTimeout || 1000
    this.parent.setCondition('connections', this.type, this._isReady = false)
    this.outboundQueue = new OutboundConnectionQueue(this)

    this.assign()
  }

  // * * * * * * * * * * * * * * MESSAGING

  /**
   * @method fetch
   * @description send request to server
   * @param {object} message - buffer instance
   * @param {number|function} timeout -
   * @param {function} callback -
   * @callback {null|object}
   * */

  fetch (message, timeout, callback) {
    if (timeout instanceof Function) {
      callback = timeout
      timeout = 0
    }

    this.socket
      .fetch(Buffer.concat([fetchMarker, message]), timeout)
      .then((result) => callback(null, result))
      .catch(callback)
  }

  /**
   * @method notify
   * @description push data to queue
   * @param {object} message - buffer instance
   * */

  notify (message) {
    this.outboundQueue.pushTask(Buffer.concat([notifyMarker, message]))
  }

  /**
   * @method send
   * @description send message to server without confirmation
   * @param {object} message - buffer instance
   * @returns {void}
   * */

  send (message) {
    this.socket.send(Buffer.concat([sendMarker, message]))
  }

  // * * * * * * * * * * * * * * SETUP

  assign () {
    this.socket = this.createConnection()
      .on('error', (err) => {
        this.emit('__wait')

        this.socket.removeAllListeners('connect')
        this.socket.removeAllListeners('message')
        this.socket.removeAllListeners('close')
        this.socket.removeAllListeners('end')

        this.parent.setCondition('connections', this.type, this._isReady = false)
        this.socket = null

        setTimeout(() => {
          this.assign()
        }, this.reconnectTimeout)

        this.debug(`Socket error (${ this.type }) `, err)
      })
  }

  authorize (message) {
    message.body = packAuth(255, this.parent.selfIp, this.parent.selfId, this.parent.password)
    this.socket.send(message)

    setTimeout(() => {
      if (!this.socket.destroyed) {
        this.parent.setCondition('connections', this.type, this._isReady = true)
        this.emit('__ready')
      }
    }, 350)
  }

  createConnection (socket = net.createConnection()) {
    socket
      .on('connect', () => {
        this.debug(`new socket connected to ${ this.net.port ? `${ this.net.host }:${ this.net.port }` : this.net.path }`)
      })

      .on('message', (message) => {
        if (!isValidMessage(message)) {
          return  // new Error(`Invalid message was received on ${ this.type } server`)
        }

        if (message.body.readUInt8(0) === 255) {
          return this.authorize(message)
        }

        this.parent.emit('message', message, 0, this.type, false)
      })
      .on('close', (withError) => {
        this.debug('__________________ close')
        if (!withError) {
          socket.destroy(new Error('socket destroyed'))
        }
      })
      .on('end', () => {
        this.debug(`socket ${ this.net.port ? `${ this.net.host }:${ this.net.port }` : this.net.path } got end message`)
      })
      .connect(this.net, () => {})

    frame(socket)
    return socket
  }
}

module.exports = Connection
