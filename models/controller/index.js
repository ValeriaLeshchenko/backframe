'use strict'

const Connection = require('../connection')
const ErrorHandler = require('../errorHandler')
const Model = require('../model')
const NetServer = require('../netServer')
const { ipToNumber } = require('../../lib')

class Controller extends Model {

  /**
   * @param {parent} parent
   * @param {object} options
   * @param {string} options.password
   * @param {number} options.selfId
   * @param {string|number} options.selfIp
   * @param {object} options.settings
   * @param {object} options.errorHandler
   * @param {boolean} options.isSmart
   * @param {boolean|void} options.safeMode
   * */

  constructor (parent, options) {
    super(parent, options)

    // * * * * * * * * * * * * * * VERIFICATION SETTINGS
    this.password = options.password
    this.selfId = options.selfId
    this.selfIp = typeof options.selfIp === 'number' ? options.selfIp : ipToNumber(options.selfIp)

    if (!this.password) {
      throw Error(`Invalid password has been set!`)
    }

    this.errorHandler = new ErrorHandler(options.errorHandler || {})
    this.build(options.settings)
  }

  build (settings) {

    if (settings.netServers) {
      this.netServers = {}
      this.conditions.netServers = {}
      const list = settings.netServers.list

      for (let i = 0; i < list.length; i++) {
        const name = list[i]
        const options = settings.netServers[name]
        options.type = name

        this.netServers[name] = new NetServer(this.parent, options)
      }
    }

    if (settings.connections) {
      this.connections = {}
      this.conditions.connections = {}
      const list = settings.connections.list

      for (let i = 0; i < list.length; i++) {
        const name = list[i]
        const options = settings.connections[name]
        options.type = name

        this.connections[name] = new Connection(this.parent, options)
      }
    }
  }
}

module.exports = Controller
