'use strict'

const chalk = require('chalk')
const format = require('date-format')

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

event.once('data', () => {
  vorpal
    .command('list devices')
    .alias('ls dev')
    .action(function (_, cb) {
      Promise.resolve(d.devices.keys().map(k => d.devices[k]))
      .then(devs => this.log(devs.map(d => d.name).join('\n')))
      .then(cb)
    })

  vorpal
    .command('list chats')
    .alias('ls chat', 'ls')
    .action(function (_, cb) {
      Promise.resolve(d.folders.keys().map(k => d.deviceByFolderId[k]))
      .then(devs => this.log(devs.map(d => d.name).join('\n')))
      .then(cb)
    })

  vorpal
    .command('add device <id> [name]')
    .alias('dev')
    .action(function (args, cb) {
      action.addDevice(args.id, args.name)
      .then(() => this.log(`${helpers.stamp()} device ${chalk.dim(args.id)} added${args.name ? ' with name ' + chalk.yellow(args.name) : ''}.`))
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
      let folder = d.chatFolderForDevice[dev.deviceID]
      let content = args.message.join(' ')
      action.sendMessage(folder.id, content)
      .then(() => this.log(`${helpers.stamp()} ${chalk.green('you')} have sent to ${chalk.yellow(dev.name)}: ${chalk.dim(content)}`))
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
})

/* notify of events  */
event.on('deviceStatusChanged', (data) => {
  vorpal.log(`${helpers.stamp(data.time)} ${chalk.yellow(d.devices[data.deviceID].name)} is ${data.status}`)
})
event.on('gotMessage', (data) => {
  var timeSent = ''
  if (data.time - data.timeSent > 120000) {
    timeSent = ' ' + chalk.blue('-- sent on') + ' ' + format('hh:mm:ss', data.timeSent)
  }
  vorpal.log(`${helpers.stamp(data.time)} ${chalk.yellow(d.devices[data.deviceID].name)} sent: ${chalk.dim(data.content)}${timeSent}`)
})
event.on('chatAccepted', (data) => {
  vorpal.log(`${helpers.stamp(data.time)} ${chalk.yellow(d.devices[data.deviceID].name)} has started a chat with you.`)
})
module.exports = vorpal
