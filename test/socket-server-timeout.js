'use strict'

const crypto = require('crypto')
const { expect } = require('chai')
const Controller = require('../models/controller')

const data = genDataArr(1000)
const serverData = []

const withServerOptions = {
  password: 'smarty',
  selfIp: '127.0.0.1',
  selfId: 1,

  settings: {
    netServers: {
      list: ['server1'],
      server1: {
        net: {
          host: '127.0.0.1',
          port: 5555
        }
      }
    }
  }
}

const withConnectionOptions = {
  password: 'smarty',
  selfIp: '127.0.0.1',
  selfId: 1,

  settings: {
    connections: {
      list: ['connection1'],
      connection1: {
        net: {
          host: '127.0.0.1',
          port: 5555
        }
      }
    }
  }
}

const TIMEOUT = 1000
let first = true

describe('Controller() safeMode data receiving', function () {
  it('should receive all data after timeout', function (done) {
    this.timeout(TIMEOUT + 5000)
    new Controller(null, withServerOptions).on('message', function (message, socketId, type, isServer) {

      if (first) {
        first = false
        this.netServers.server1.emit('__wait')
        setTimeout(() => {

          this.netServers.server1.emit('__ready')
        }, TIMEOUT)
      }

      serverData.push(message.body.toString())
      if (data.length === serverData.length) {

        data.forEach((e, i) => {
          expect(e).to.equal(serverData[i])
        })

        done()
      }
    })

    const connectionOne = new Controller(null, withConnectionOptions).on('ready', () => {

      for (let i = 0; i < data.length; i++) {
        connectionOne.connections.connection1.notify(Buffer.from(data[i]))
      }
    })
  })
})

function genDataArr (length) {
  const arr = []

  while (length--) {
    arr.push(crypto.randomBytes(64).toString('hex'))
  }

  return arr
}