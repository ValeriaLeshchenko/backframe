'use strict'

const Queue = require('../queue')

class IncomingServerQueue extends Queue {

  constructor (server, options = {}) {
    super(options)
    this.concurrency = options.concurrency || 1000
    this.server = server
      .on('__ready', () => {
        this.canSend = true

        setImmediate(() => this.next())
      })
      .on('__wait', () => this.canSend = false)
  }

  execute (args, callback) {
    setImmediate(() => {
      this.server.parent.emit('message', ...args)
      callback()
    })
  }

  next () {
    while (this.canSend && this.running < this.concurrency && this.queue.length > 0) {
      this.execute(this.queue.shift(), () => {
        this.running--

        this.next()
      })
      this.running++
    }
  }
}

module.exports = IncomingServerQueue
