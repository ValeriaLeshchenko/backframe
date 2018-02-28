'use strict'

const Controller = require('../models/controller')

const options = {
  password: 'smarty',
  selfIp: '127.0.0.1',
  selfId: 1,

  settings: {
    connections: {
      list: ['connection1'],
      connection1: {
        net: {
          host: '127.0.0.1',
          port: 7777
        }
      }
    },
    netServers: {
      list: ['server1'],
      server1: {
        net: {
          host: '127.0.0.1',
          port: 7777
        }
      }
    }
  }
}

describe('Controller() check states', () => {

  it('should emit stateChange & conditionsChange events before ready', function (done) {
    const set = new Set()
    new Controller(null, options)
      .on('ready', () => {
        set.add('ready')
        if (set.size === 3) {
          done()
        }
      })
      .on('stateChange', () => { set.add('stateChange') })
      .on('conditionsChange', () => { set.add('conditionsChange') })
  })
})
