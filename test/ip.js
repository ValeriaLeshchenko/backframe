'use strict'

const { expect } = require('chai')
const { ipToNumber, numberToIp } = require('../lib')

const ipList = [
  '0.0.0.0',
  '0.0.0.255',
  '0.0.1.0',
  '127.0.0.1',
  '192.168.0.1',
  '255.255.255.255',
]

const set = new Set

describe('ipToNumber(), numberToIp()', () => {
  for (let i = 0; i < ipList.length; i++) {
    it(`should convert ip ${ipList[i]} to number and reverse`, function () {
      const num = ipToNumber(ipList[i])
      set.add(num)
      expect(numberToIp(num)).to.be.equal(ipList[i])
    })
  }

  it(`expect transform will be without intersections`, () => {
    expect(set.size).to.equal(ipList.length)
  })
})
