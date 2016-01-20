'use strict'

const chalk = require('chalk')
const format = require('date-format')

module.exports.stamp = (d) => {
  if (!d) {
    d = new Date()
  } else if (typeof d === 'string') {
    d = new Date(Date.parse(d))
  }

  return chalk.bgBlue('[' + format('hh:mm:ss', d) + ']')
}
