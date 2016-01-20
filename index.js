'use strict'

const chalk = require('chalk')
const core = require('syncthing-chat-core')

const helpers = require('./helpers')

const vorpal = require('vorpal')()
  .delimiter(chalk.blue('syncthing-chat') + '~$')

/* changing default commands */
vorpal.find('help').alias('?')
vorpal.find('exit').description(`Exits syncthing-chat.`)

var deviceNames = {}
var devicesByName = {}
core.listDevices().then(devices => {
  devices.forEach(d => {
    deviceNames[d.deviceID] = d.name
    devicesByName[d.name] = d
  })
})

vorpal
  .command('list devices')
  .alias('ls dev')
  .action(function (_, cb) {
    core.listDevices().then(devs => {
      this.log(devs.map(d => d.name).join('\n'))
    }).then(cb)
  })

vorpal
  .command('list chats')
  .alias('ls chat', 'ls')
  .action(function (_, cb) {
    core.listChats().then(chats => {
      this.log(chats.map(c => deviceNames[c.deviceID]).join('\n'))
    }).then(cb)
  })

vorpal
  .command('create chat')
  .option('-w, --with <name>')
  .action(function (args, cb) {
    let dev = devicesByName[args.options.with]
    core.createChat(dev.deviceID)
    .then(vorpal.exec('list chats'))
    .then(cb)
  })

vorpal
  .command('message <name> <message>')
  .alias('/msg')
  .action(function (args, cb) {
    let dev = devicesByName[args.name]
    core.sendMessage(dev.deviceID, args.message)
  })

/* notify of events  */
core.st.on('someoneOnline', (data) => {
  console.log(`${helpers.stamp(data.time)} ${chalk.yellow(deviceNames[data.deviceID])} is online`)
})
core.st.on('someoneOffline', (data) => {
  console.log(`${helpers.stamp(data.time)} ${chalk.yellow(deviceNames[data.deviceID])} is offline`)
})
core.st.on('gotMessage', (data) => {
  console.log(`${helpers.stamp(data.time)} ${chalk.yellow(deviceNames[data.deviceID])} sent: ${data.message}`)
})

module.exports = vorpal
