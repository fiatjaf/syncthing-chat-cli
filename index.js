'use strict'

const chalk = require('chalk')
const core = require('syncthing-chat-core')
const action = core.action
const event = core.event
const d = core.data

const helpers = require('./helpers')

const vorpal = require('vorpal')()
  .delimiter(chalk.blue('syncthing-chat') + '~$')

/* changing default commands */
vorpal.find('help').alias('?')
vorpal.find('exit').description(`Exits syncthing-chat.`)

vorpal
  .command('list devices')
  .alias('ls dev')
  .action(function (_, cb) {
    action.listDevices()
    .then(devs => this.log(devs.map(d => d.name).join('\n')))
    .then(cb)
  })

vorpal
  .command('list chats')
  .alias('ls chat', 'ls')
  .action(function (_, cb) {
    action.listDevicesWithChats()
    .then(devs => this.log(devs.map(d => d.name).join('\n')))
    .then(cb)
  })

vorpal
  .command('create chat')
  .option('-w, --with <name>')
  .action(function (args, cb) {
    let dev = d.deviceByName[args.options.with]
    action.createChat(dev.deviceID)
    .then(cb)
  })

vorpal
  .command('message <name> [message...]')
  .alias('/msg')
  .action(function (args, cb) {
    let dev = d.deviceByName[args.name]
    action.sendMessage(dev.deviceID, args.message.join(' '))
    .then(cb)
  })

vorpal
  .command('messages <name>')
  .action(function (args, cb) {
    let dev = d.deviceByName[args.name]
    action.listMessages(dev.deviceID)
    .then(msgs => this.log(msgs.map(m => `${helpers.stamp(m.time)} ${chalk.yellow(d.devices[m.sender].name)}: ${m.content}`).join('\n')))
    .then(cb)
  })

/* notify of events  */
event.on('someoneOnline', (data) => {
  vorpal.log(`${helpers.stamp(data.time)} ${chalk.yellow(d.devices[data.deviceID].name)} is online`)
})
event.on('someoneOffline', (data) => {
  vorpal.log(`${helpers.stamp(data.time)} ${chalk.yellow(d.devices[data.deviceID].name)} is offline`)
})
event.on('gotMessage', (data) => {
  vorpal.log(`${helpers.stamp(data.time)} ${chalk.yellow(d.devices[data.deviceID].name)} sent: ${chalk.dim(data.message)}`)
})
event.on('chatAccepted', (data) => {
  vorpal.log(`${helpers.stamp(data.time)} ${chalk.yellow(d.devices[data.deviceID].name)} has started a chat with you.`)
})
module.exports = vorpal
