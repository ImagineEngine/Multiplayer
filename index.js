const webSocketsServerPort = 8000;
const webSocketServer = require('websocket').server;
const http = require('http');

const server = http.createServer();
server.listen(webSocketsServerPort);
console.log('listening on port 8000');

const wsServer = new webSocketServer({
  httpServer: server
});

async function sleep(ms){return new Promise(resolve => {setTimeout(resolve, ms)})}

var players = {}
var playerTerminal = {}
var messages = []
var playerUpdates = {}
var idgen = 1;
totalHealth = 10

wsServer.on('request', function (request) {

  const connection = request.accept(null, request.origin);

  connection.on('message', function(message) {
      if (message.type == 'utf8') {
        try{
          if (message.utf8Data.startsWith('{')){
            data = JSON.parse(message.utf8Data)
            if (data.status == 'register'){
              var userID = "0000".substring(0, '0000'.length - String(idgen).length) + String(idgen);
              idgen += 1
              console.log(userID)
              players[userID] = {position: {x: 0, y: 0}, name: data.name, color: data.color, health: totalHealth}
              playerTerminal[userID] = connection
              playerTerminal[userID].sendUTF(JSON.stringify({players: players, messages: messages, status: 'registered', id: userID}));
              sendAll(JSON.stringify({status: 'join', name: data.name, id: userID, color: data.color}));
              playerUpdates[userID] = new Date().getTime()
              console.log('new user: '+data.name)
            }
            if (data.status == 'disconnect'){
              console.log('bye'+data.userID)
              name = players[data.userID].name
              id = data.userID
              delete players[data.userID]
              delete playerUpdates[data.userID]
              delete playerTerminal[data.userID]
              sendAll(JSON.stringify({players: players, status: 'leave', name: name, id: id}));
            }
            if (data.status == 'message'){
              messages.push([String(data.userID), players[data.userID].name, data.message])
              sendAll(JSON.stringify({messages: messages, status: 'message'}));
            }
            if (data.status == 'attack'){
              data.attacked.forEach((attackedPlayer) => {
                hurt(attackedPlayer, 1)
                playerTerminal[attackedPlayer].sendUTF(JSON.stringify({status: 'hit'}))
              })
              sendAll('a'+attacked.join()+','+1)
              console.log('a'+attacked.join()+','+1)
            }
          }
          else{
            data = message.utf8Data
            status = data[0]
            id = data.slice(1, 5)
            if(status == 'u'){
              position = data.slice(5).split(',')
              players[id].position.x = position[0]
              players[id].position.y = position[1]
              sendAll(data);
            }
            if(status == 'p'){
              playerTerminal[id].sendUTF(JSON.stringify({status: 'ping'}));
              playerUpdates[id] = new Date().getTime()
            }
            if(status == 'd'){
              if (Math.abs(parseInt(data.slice(5))) > 3){
                hurt(id, 1)
                sendAll('a'+attacked.join()+','+1)
              }
            } 
          }
        }
        catch{}
      }
  })

});

function sendAll(message){
  for (var player in playerTerminal){
    playerTerminal[player].sendUTF(message);
  }
}

function hurt(id, damage){
  if (players[id].health > damage) {
    players[id].health -= damage;
  }
  else{
    teleport(id, {x: 0, y: 0})
    players[id].health = totalHealth
  }
  playerTerminal[id].sendUTF(JSON.stringify({status: 'hit'}))
}
  

function teleport(player, position){
  playerTerminal[player].sendUTF(JSON.stringify({status: "teleport", position: position}))
  players[player].position = position
  sendAll(JSON.stringify({players: players, messages: messages}))
}

async function byeButWhy(){
  while (true){
    for (var player in playerTerminal){
      if (new Date().getTime() - playerUpdates[player] > 5000){
        console.log('bye but why...')
        var name = players[player].name
        delete players[player]
        delete playerUpdates[player]
        delete playerTerminal[player]
        sendAll(JSON.stringify({players: players, status: 'leave', name: name}));
      }
    }
    await sleep(500)
  }
}

byeButWhy()