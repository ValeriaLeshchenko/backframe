'use strict'

const fs = require('fs')
const CUBE = Math.pow(256, 3)
const SQUARE = Math.pow(256, 2)

module.exports = {
  deleteSocketFile,
  ipToNumber,
  isValidMessage,
  numberToIp,
  packAuth,
  unpackAuth
}

function deleteSocketFile (path) {

  if (fs.existsSync(path)) {
    if (fs.accessSync(path, fs.constants.R_OK | fs.constants.W_OK) === void 0) {
      return fs.unlinkSync(path)
    }

    throw new Error(`you have no rights to read file: ${path}`)
  }
}

function ipToNumber (ip) {
  const [a, b, c, d] = ip.split('.')
  return a * CUBE + b * SQUARE + c * 256 + +d || null
}

function isValidMessage (msg) {
  return msg instanceof Object && msg.body instanceof Buffer
}

function numberToIp (int) {
  return `${((int >> 24) & 255)}.${((int >> 16) & 255)}.${((int >> 8) & 255)}.${int & 255}`
}

/**
 * @function packAuth
 * @description pack auth data
 * @param {number} type
 * @param {number} ipInt
 * @param {number} port
 * @param {string} pass
 * @returns {object} - buffer
 */

function packAuth (type, ipInt = 0, port = 0, pass = '') {
  const buf = Buffer.alloc(11)
  buf.writeUInt8(type, 0)
  buf.writeDoubleLE(ipInt, 1)
  buf.writeUInt16LE(port, 9)
  return Buffer.concat([buf, Buffer.from(pass)])
}

/**
 * @function unpackAuth
 * @description pack auth data
 * @param {object} buf
 * @returns {object} - array [type, password]
 */

function unpackAuth (buf) {

  return [
    buf.readUInt8(0),
    buf.readDoubleLE(1),
    buf.readUInt16LE(9),
    buf.slice(11, buf.byteLength).toString()
  ]
}
