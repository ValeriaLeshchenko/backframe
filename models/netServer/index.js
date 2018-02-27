'use strict'

const net = require('net')
const NetLayer = require('../netLayer')
const IncomingServerQueue = require('../incomingServerQueue')
const { isValidMessage, numberToIp, packAuth, unpackAuth } = require('../../lib')
const { frame } = require('frame-net')
const emptyBuffer = Buffer.alloc(0)

class NetServer extends NetLayer {

  constructor (parent, options) {
    super(parent, options)

    this.type = options.type
    // * * * * * * * * * * * * * * START VERIFICATION SETTINGS
    this.verificationTime = options.verificationTime || 1000
    // * * * * * * * * * * * * * * END VERIFICATION SETTINGS

    this.getNewId = counter()
    this.clients = new Set()
    this.relations = new Map()
    this.queue = new IncomingServerQueue(this)

    this.assign()
  }

  // * * * * * * * * * * * * * * SETUP

  assign () {
    this.server = this.createServer()
      .on('error', (err) => {
        this.emit('__wait')
        this.parent.setCondition('netServers', this.type, this._isReady = false)
        this.close(err)
        this.server = null

        setTimeout(() => {
          this.assign()
        }, 1000)
      })

    this.parent.setCondition('netServers', this.type, this._isReady = true)
  }

  close (err) {
    // experimental flow
    this.server.unref()
    this.server.removeAllListeners()

    for (let socket of this.clients) {
      this.relations.delete(socket._id)
      socket.end()
      socket.destroy(err)
    }

    this.server.close()
  }

  createServer (server = net.createServer()) {
    return server
      .on('connection', socket => { this.handleSocket(socket) })
      .on('listening', () => {
        this.parent.setCondition('netServers', this.type, this._isReady = true)
        setImmediate(() => {
          if (this.parent.isReady) {
            this.emit('__ready')
          }
        })
      })
      .on('close', () => { this.debug(`net server closed`) })
      .listen(this.net)
  }

  handleSocket (socket) {
    socket._id = this.getNewId()

    frame(socket)
    this.verify(socket)

    socket
      .on('error', (err) => {
        this.debug(err, `Server socket error (${ this.type })`)

        socket.removeAllListeners()

        this.relations.delete(socket._id)
        this.clients.delete(socket)
      })
      .on('close', (withError) => {

        if (!withError) {
          socket.destroy(new Error('socket destroyed'))
        }
      })
      .on('end', () => {
        this.debug(`socket ${ this.net.port ? `${ this.net.host }:${ this.net.port }` : this.net.path } got end message`)
      })
      .on('timeout', () => { socket.end() })
  }

  verify (socket) {
    socket.isVerifyed = false

    const t = setTimeout(() => {
      socket.destroy(new Error(`Unauthorized`))
    }, this.verificationTime)

    socket.fetch(packAuth(255)).then((message) => {
      const [type, ip, port, pass] = unpackAuth(message.body)

      if (this.parent.password === pass) {
        clearTimeout(t)
        socket.isVerifyed = true
        socket.ip = numberToIp(ip)
        socket.port = port

        socket.on('message', (message) => {
          if (!isValidMessage(message)) {
            return
          }

          const marker = message.body.readUInt8(0)
          const body = message.body.slice(1)

          if (marker === 1) {
            message.body = emptyBuffer
            socket.send(message)
          }

          message.body = body
          this.queue.pushTask([message, socket._id, this.type, true])

        })

        this.clients.add(socket)
        this.relations.set(socket._id, socket)

        this.parent.emit('authentication', socket)
      }
    }).catch((err) => {
      this.parent.errorHandler.error(err, this.type)
    })
  }

  // * * * * * * * * * * * * * * MESSAGING

  answer (message, socketId) {
    if (this.relations.has(socketId) && !this.relations.get(socketId).destroyed) {
      this.relations.get(socketId).send(message)
    }
  }

  broadcast (message) {
    for (let socket of this.clients) {
      socket.send(message)
    }
  }
}

module.exports = NetServer

function counter () {
  let i = 0
  return () => ++i
}
