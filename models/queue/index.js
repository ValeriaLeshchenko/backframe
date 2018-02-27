'use strict'

const EventEmitter = require('events').EventEmitter

class Queue extends EventEmitter {

  /**
   * @param {object} options
   * @param {number|void} options.concurrency
   * @param {string|void} options.path
   * */

  constructor (options = {}) {
    super()
    this.running = 0 // current execution counter
    this.concurrency = options.concurrency || 1 // queue concurrency
    this.queue = [] // queue storage
  }

  /**
   * @method execute
   * @param {*} task
   * @param {function} callback
   * */

  execute (task, callback) { // bimbo
    setImmediate(() => {
      callback()
    })
  }

  /**
   * @method next
   * */

  next () {
    while (this.running < this.concurrency && this.queue.length > 0) {
      this.execute(this.queue.shift(), () => {
        this.running--

        this.next()
      })
      this.running++
    }
  }

  /**
   * @method pushTask
   * @param {*} task - arguments for executor
   * */

  pushTask (task) {
    this.queue.push(task)
    this.next()
  }
}

module.exports = Queue
