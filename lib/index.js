'use strict'

const fs = require('fs')
const CUBE = Math.pow(256, 3)
const SQUARE = Math.pow(256, 2)

module.exports = {
  deleteSocketFile,
  ipToNumber,
  numberToIp
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

function numberToIp (int) {
  return `${((int >> 24) & 255)}.${((int >> 16) & 255)}.${((int >> 8) & 255)}.${int & 255}`
}
