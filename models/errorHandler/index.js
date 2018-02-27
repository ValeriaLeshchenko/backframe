'use strict'

const fs = require('fs')
const mkdirp = require('mkdirp-sync')

class ErrorHandler {

  constructor (options) {

    this.logPath = chorePath.call(this, options.logPath || 'logs/log.txt')
    this.errPath = chorePath.call(this, options.errPath || 'logs/error.txt')

    this.logStream = fs.createWriteStream(this.logPath, { flags: 'a' })
    this.errStream = fs.createWriteStream(this.errPath, { flags: 'a' })
  }

  error (err, sender) {
    if (err instanceof Error) {
      this.errStream.write(`${ sender }: ${ err.message || err.code }\n`)
      this.errStream.write(`${err.stack}\n`)
    }
    else {
      this.errStream.write(err)
    }
  }

  log () {
    this.logStream.write(...arguments, '\n')
  }
}

module.exports = ErrorHandler

/**
 * @function chorePath
 * @description checks path exists and change it path if true
 * @param {string} path - path to file
 * @returns {string}
 * */

function chorePath (path) {
  mkdirp(path.substring(0, path.lastIndexOf('/')))
  return path
}
