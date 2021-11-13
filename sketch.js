/*jshint esversion:10*/

var socket = new WebSocket('wss://server.imagineengine.repl.co/')
var connecting = true

socket.onopen = function(){
  document.getElementById('connecting').style.display = 'none'
}


class Player{
  constructor(id, name, color, health=10, x=0, y=0) {
    Player.list[id] = this
    this.id = id;
    this.x = x;
    this.y = y;
    this.color = color
    this.name = name
    this.health = health
  }
  delete(){
    delete this
  }
}
Player.list = {}


var selfID;
var x = 0;
var dx = 0;
var y = 0;
var dy = 0;
var g = 0.098*2
var drag = 0.98
var n = 0;
var players = {};
var messages = []
var img;
var t;
var ping;
var overlay;
var joystickTouch = false;
var joystickPosition = { 'x': 0, 'y': 0 }
var colors = {"#FF0000": [255, 0, 0], "#FF8800": [255, 150, 0], "#FFFF00": [255, 255, 0], "#00FF00": [0, 255, 0], "#00FFFF": [0, 255, 255], "#007D00": [0, 127, 0], "#0000FF": [0, 0, 255], "#7F00FF": [127, 0, 255], "#FF00FF": [255, 0, 255], "#FFFFFF": [255, 255, 255], "#333333": [51, 51, 51], "#663300": [102, 51, 0]}
selected = "#FF0000"
var chatBoxOn = false
var self;

//P5 Display


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}


function preload() {
  img = loadImage('https://i.imgur.com/dTVE5UL.png');
  document.getElementById("p5_loading").style = "display: none"
  document.getElementById("input").focus();
  console.log(document.cookie.split(';'))
  change('#FF0000')
  if (document.cookie.includes('name')){
    var cookie = document.cookie.split(';')
    for (var arg in cookie){
      console.log(cookie[arg])
      if (cookie[arg].includes('name')){
        console.log(JSON.parse(cookie[arg]).name)
        document.getElementById('input').value = JSON.parse(cookie[arg]).name;
        change(JSON.parse(cookie[arg]).color)
        break
      }
    }
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  document.getElementById("defaultCanvas0").style = 'display: none'
}

function draw() {
  background(0, 0, 0, 0);
  fill(255)
  rect(-1000 - x + width / 2 - 20, -1000 - y + height / 2 - 20, 2040, 2040)
  image(img, -1000 - x + width / 2, -1000 - y + height / 2);
  textSize(15);
  strokeWeight(1);
  textAlign(LEFT, TOP);
  text('ping: '+String(ping), 10, 10)
  textAlign(CENTER, CENTER);
  fill(colors[selected])
  ellipse(width / 2, height / 2, 25, 25);
  //strokeWeight(3)
  try{
    /*for (var i = 0; i < Object.keys(players).length; i++) {
      if (Object.keys(players)[i] == selfID){}
      else{
        try{
        fill(colors[players[Object.keys(players)[i]].color])
        }
        catch{}
        ellipse(players[Object.keys(players)[i]].position.x - x + windowWidth / 2, players[Object.keys(players)[i]].position.y - y + windowHeight / 2, 25, 25)
        fill(255)
        text(players[Object.keys(players)[i]].name+" ("+players[Object.keys(players)[i]].health+"❤)", players[Object.keys(players)[i]].position.x - x + windowWidth / 2, players[Object.keys(players)[i]].position.y - y + windowHeight / 2 - 30);
      }
    }*/
  for (playerID in Player.list){
    if(playerID != selfID){
      console.log('update')
      player = Player.list[playerID]
      try{
        fill(colors[player.color])
        }
        catch{}
        ellipse(player.x - x + windowWidth / 2, player.y - y + windowHeight / 2, 25, 25)
        fill(255)
        text(player.name+" ("+player.health+"❤)", player.x - x + windowWidth / 2, player.y - y + windowHeight / 2 - 30);
    }
  }
  
  }
  catch{}
  fill(255)
  try{
    text('You ('+Player.list[selfID].health+"❤)", width / 2, height / 2 - 30);
  }
  catch{}
  fill(255, 255, 255, 100)
  ellipse(windowWidth / 7, windowHeight - windowWidth / 7, windowWidth / 4, windowWidth / 4)
  
  if (joystickTouch) {
    if (Math.sqrt(Math.pow(mouseX - windowWidth / 7, 2) + Math.pow(mouseY + windowWidth / 7 - windowHeight, 2)) < windowWidth / 8) {
      ellipse(mouseX, mouseY, windowWidth / 12, windowWidth / 12)

      joystickPosition = { 'x': mouseX - windowWidth / 7, 'y': mouseY + windowWidth / 7 - windowHeight }
    }
    else {
      ratio = (windowWidth / 8) / Math.sqrt(Math.pow(mouseX - windowWidth / 7, 2) + Math.pow(mouseY + windowWidth / 7 - windowHeight, 2))

      ellipse((mouseX - windowWidth / 7) * ratio + windowWidth / 7, (mouseY + windowWidth / 7 - windowHeight) * ratio + windowHeight - windowWidth / 7, windowWidth / 12, windowWidth / 12)

      joystickPosition = { 'x': (mouseX - windowWidth / 7) * ratio, 'y': (mouseY + windowWidth / 7 - windowHeight) * ratio }
    }
  }
}


function start() {
  if (!document.getElementById('input').value == "") {
    document.cookie = JSON.stringify({name: document.getElementById("input").value, color: selected})
    socket.send(JSON.stringify({
      status: 'register',
      name: document.getElementById("input").value,
      color: selected
    }))
    document.getElementById('defaultCanvas0').style = 'display: block; overflow: none'
    spot = document.createElement("div")
    spot.id = "spot"
    spot.className = "spotlight"
    spot.style = "position: absolute; left: "+String(-window.innerWidth/2)+"px; top:"+String(-window.innerHeight/2)+"px";
    document.getElementById('spotlight').appendChild(spot)
    document.getElementById('name').style = 'display: none'
    document.getElementById('ms').style = "display: block"
    document.getElementById('at').style = "display: block"
    document.getElementById('alert').style.display = "block"
    document.getElementsByTagName("html")[0].style = "overflow:hidden"
    var elem = document.getElementById("body");
    elem.requestFullscreen()
  }
}

socket.onmessage = async function(message) {
  if (JSON.parse(message.data).status == 'registered') {
    selfID = JSON.parse(message.data).id
    players = JSON.parse(message.data).players
    messages = JSON.parse(message.data).messages
    console.log(messages)
    for (i in Object.keys(players)){
      id = Object.keys(players)[i]
      console.log(new Player(id, players[id].name, players[id].color, players[id].health, players[id].position.x, players[id].position.y))
    }
    
    console.log(selfID)
    socket.send('p'+selfID)
    socket.send('u'+selfID+0+','+0)
    game()
    update()
    t = new Date().getTime()
    socket.onmessage = async function(message) {
      if(message.data.startsWith('{')){
        if (JSON.parse(message.data).status == 'ping'){
          ping = new Date().getTime()-t
          socket.send('p'+selfID)
          t = new Date().getTime()
        }
        else{
          try{
            players = JSON.parse(message.data).players

          }
          catch{}
          try{
            messages = JSON.parse(message.data).messages
          }
          catch{}
          //try{
            status = JSON.parse(message.data).status
            if (status == 'message'){
              if (chatBoxOn){
                updateMessage()
              }
              else{
                document.getElementById('ms').className = "msa"
              }
            }
            if (status == 'join'){
              data = JSON.parse(message.data)
              console.log(new Player(data.id, data.name, data.color))
              document.getElementById('update').innerHTML = JSON.parse(message.data).name + ' has joined the game'
              await sleep(3000);
              for (var i = 100; i>=0; i--){
                document.getElementById('alert').style.opacity = String(i/100)
                await sleep(10)
              }
              document.getElementById('update').innerHTML = ''
              document.getElementById('alert').style.opacity = "1"
            }
            if (status == 'leave'){
              document.getElementById('update').innerHTML = JSON.parse(message.data).name + ' has left the game'
              console.log(Player.list[JSON.parse(message.data).id])
              delete Player.list[JSON.parse(message.data).id]
              await sleep(3000);
              for (var j = 100; j>=0; j--){
                document.getElementById('alert').style.opacity = String(j/100)
                await sleep(10)
              }
              document.getElementById('update').innerHTML = ''
              document.getElementById('alert').style.opacity = "1"
            }
            if (status == 'hit'){
              hurt()
              //add vibrations and red
            }
            if (status == 'teleport'){
              x = JSON.parse(message.data).position.x
              y = JSON.parse(message.data).position.y
              console.log("teleport")
            }
          //}
          //catch{}
        }
      }
      
      else{
        data = message.data
        status = data[0]
        id = data.slice(1, 5)
        if (status == 'u'){
          //console.log('update')
          //console.log(Number(data.slice(5).split(',')[0]))
          Player.list[id].x = Number(data.slice(5).split(',')[0])
          Player.list[id].y = Number(data.slice(5).split(',')[1])
        }
        if (status == 'a'){
          attacked = data.slice(1).split(',')
          damage = attacked[attacked.length-1]
          attacked = attacked.slice(0, attacked.length-1)
          for (n in attacked){
            Player.attacked[n].health -= damage
          }
        }
      }
    }
  }
}

socket.onerror = async function(e){
  document.getElementById('error').style = "display: block"
  for (i = 0; i <= 20; i++){
    document.getElementById('retry').innerHTML = "Retrying in "+ String(20-i) + " seconds ..."
    await sleep(1000);
  }
  location.reload()
}

socket.onclose = async function(e){
  document.getElementById('error').style = "display: block"
  for (j = 0; j <= 20; j++){
    document.getElementById('retry').innerHTML = "Retrying in "+ String(20-j) + " seconds ..."
    await sleep(1000);
  }
  location.reload()
}



async function game() {
  while (true) {

    if (joystickTouch) {
      if (dx**2+dy**2 < 7**2){
        dx += parseInt(joystickPosition.x / (windowWidth) * 32)*2/50
        dy += parseInt(joystickPosition.y / (windowWidth) * 32)*2/50
      }
    }
    
        if (x > 1000) {
      x = 1000
      socket.send('d'+selfID+dx)
      dx *= -1;
      
    }
    if (x < -1000) {
      x = -1000
      socket.send('d'+selfID+dx)
      dx *= -1;
      
    }
    if (y > 1000) {
      y = 1000
      socket.send('d'+selfID+dy)
      dy *= -1; 
                  
    }
    if (y < -1000) {
      y = -1000
      socket.send('d'+selfID+dx)
      dx *= -1;
      
    }
    
    if (Math.abs(dx) < 0.05){
      dx = 0
    }
    else{
      x += dx
    }
    if (Math.abs(dy) < 0.05){
      dy = 0
    }
    else{
      y += dy
    }
    //dy += g
    dx *= drag
    dy *= drag
    resizeCanvas(windowWidth, windowHeight);
    await sleep(17)
  }
}

async function update() {
  while (true) {
    if (dx+dy != 0){
      socket.send('u'+selfID+x+','+y)
    }
    await sleep(17)
    //console.log(players)
  }
}

function change(color){
    	document.getElementById(color).style = "box-shadow: 0 0 0 5pt " + color + "; background-color: "+color
    	document.getElementById(selected).style = "height: 50px; width: 50px; background-color: "+selected+"; border-radius: 50%; display: inline-block; text-align: center; padding: auto; border: 5px solid black; margin: 30px;"
  selected = color
	
}

function touchStarted() {
  if (!chatBoxOn){
    if (Math.sqrt(Math.pow(mouseX - windowWidth / 7, 2) + Math.pow(mouseY + windowWidth / 7 - windowHeight, 2)) < windowWidth / 8) {
      joystickTouch = true
    }
  }
}

function touchEnded() {
  joystickTouch = false
}

document.onfullscreenchange = function(){
  if(document.fullscreen){
    document.getElementById("fs").style = "display: none;"
  }
  else{
    document.getElementById("fs").style = "display: block"
  }
}

function disconnect(){
  
}

function updateMessage() {
  console.log('messages '+messages)
  document.getElementById("messages").remove()
  var div = document.createElement("div")
  div.class="container"
  div.id="messages"
  div.style="width: 100%; background-color:#FFFFFF;overflow: auto;height: 90%; margin:auto; background-color: #F0F0F0"
  for (var i = 0; i < messages.length; i++) {
    var box = document.createElement("div");
    var name = document.createElement("p");
    var chat = document.createElement("p");
    chat.innerHTML = messages[i][2]
    name.innerHTML = messages[i][1]

    if (selfID == messages[i][0]) {
      name.style = "color: " + selected + "; padding: 5px; text-align: right;-webkit-text-stroke: 0.5px black; margin: 0px 0px 8px 0px; font-size: 20px;"
      chat.style = "text-align: right;padding: 5px;margin: -20px 0px 0px 0px;color: black"
      box.style = "float:right; background-color: #4287f5; width: 60% ;margin: 10px 5px 10px 5px;border-radius: 10px 10px 0px 10px;"
    }
    else{
      try{
      name.style = "color: " + players[messages[i][0]].color + "; padding: 5px; -webkit-text-stroke: 0.5px black;margin: 0px 0px 8px 0px; font-size: 20px;"
      }
      catch{
        name.style = "padding: 5px; -webkit-text-stroke: 0.5px black;margin: 0px 0px 8px 0px;  font-size: 20px;"
      }
    chat.style = "padding: 5px;margin: -20px 0px 0px 0px;color:black; text-align: left"
    box.style = "background-color: #4287f5; width: 60%; float: left; margin: 10px 5px 10px 5px; text-align: left; border-radius: border-radius: 25px 25px 0px 25px; border-radius: 10px 10px 10px 0px"
    }
    
    box.appendChild(name)
    box.appendChild(chat)
    div.appendChild(box)
  }
  overlay = document.getElementById("id01")
  overlay.insertBefore(div, overlay.firstChild);
  overlay.style = "display:block"
  div.scroll(0, div.scrollHeight)
}

function messageHandle(){
  if (chatBoxOn){
    chatBoxOn = false
    overlay = document.getElementById("id01")
    overlay.style = "display:none"
    document.getElementById('alert').style.display = "block"
  }
  else{
    document.getElementById('ms').className = "ms"
    chatBoxOn = true
    document.getElementById('alert').style.display = "none"
    updateMessage()
    document.getElementById("mi").focus();
  }
}

function keyPressed() {
  if (keyCode === ENTER) {
    if (chatBoxOn){
      chatMessage()
    }
    if (document.getElementById('name').style.display == ""){
      start()
    }
  }
}

function chatMessage(){
  message = document.getElementById("mi").value
  if (!message == ""){
    socket.send(JSON.stringify({
      status: 'message',
      userID: selfID,
      message: message
    }))
    document.getElementById("mi").value = ""
  }
}

function end(){
  if (selfID != undefined){
    socket.send(JSON.stringify({
      status: 'disconnect',
      userID: selfID
    }))
  }
  socket.close()
}

  
function onResize(){
  var spot = document.getElementById('spot');
  spot.style = "position: absolute; left: "+String(-window.innerWidth/2)+"px; top:"+String(-window.innerHeight/2)+"px";
}
  
function distance(p1, p2){
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
}
  
function attack(){
  attacked = []
  Object.keys(players).forEach((player) => {
    if (player != selfID){
      if(distance(players[player].position, {x: x, y: y}) < 130){
        attacked.push(player)
      }
    }
  })
  socket.send(JSON.stringify({status: "attack", attacked: attacked}))
}
  
async function hurt(){
  document.getElementById("spotlight2").style = "display:block; background-image: radial-gradient(circle,transparent ${window.innerHeight-200}px,rgba(255, 0, 0, 0.15) ${window.innerHeight}px);"
  document.getElementsByTagName('body')[0].animate([
  {transform: 'translate(5px, 5px) rotate(0deg)'},
  {transform: 'translate(-3px, -2px) rotate(0deg)'},
  {transform: 'translate(1px, 5px) rotate(0deg)'},
  {transform: 'none'}
], {
  duration: 150
});
  document.getElementsByTagName('body')[0].background = "rgba(255, 0, 0, 1)"
document.getElementById("spotlight2").style = "display:none"
}

function onKeyPress(){}