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
          port: 8888
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
          port: 8888
        }
      }
    }
  }
}

describe('Controller() socket-server tests', function () {

  it('should receive all message queue', function (done) {
    this.timeout(5000)

    new Controller(null, withServerOptions)
      .on('message', (message, socketId, type, isServer) => {
        serverData.push(message.body.toString())

        if (data.length === serverData.length) {

          data.forEach((e, i) => {
            expect(e).to.equal(serverData[i])
          })

          done()
        }
      })
      .on('error', done)

    const { connection1 } = new Controller(null, withConnectionOptions)
      .on('error', done)
      .connections

    connection1.on('__ready', () => {

      for (let i = 0; i < data.length; i++) {
        connection1.send(Buffer.from(data[i]))
      }
    })
  })

  it('should create new Controller instance', () => {
    expect(new Controller(null, withConnectionOptions) instanceof Controller).to.equal(true)
  })
})

function genDataArr (length) {
  const arr = []

  while (length--) {
    arr.push(crypto.randomBytes(8).toString('hex'))
  }

  return arr
}
