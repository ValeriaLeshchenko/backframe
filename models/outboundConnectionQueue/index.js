'use strict'

const Queue = require('../queue')

class OutboundConnectionQueue extends Queue {

  constructor (connection, options = {}) {
    super(options)
    this.concurrency = options.concurrency || 300
    this.connection = connection
      .on('__ready', () => {
        this.canSend = true

        setImmediate(() => this.next())
      })
      .on('__wait', () => this.canSend = false)
  }

  execute (message, callback) {
    setImmediate(() => {
      this.connection.socket
        .fetch(message, this.fetchTimeout)
        .then(() => callback(null))
        .catch(callback)
    })
  }

  /**
   * @method next
   * */

  next () {
    while (this.canSend && this.running < this.concurrency && this.queue.length > 0) {
      const task = this.queue.shift()

      this.execute(task, (e) => {
        this.running--

        if (e) { this.queue.unshift(task) }

        this.next()
      })
      this.running++
    }
  }
}

module.exports = OutboundConnectionQueue
