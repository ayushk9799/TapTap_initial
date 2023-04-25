import express from "express"
import {Server} from "socket.io"
import http from "http"
import path from 'path'
import { fileURLToPath } from 'url';
const app=express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(__dirname)
console.log(path.join(__dirname,'/index.html'))
const server= http.createServer(app)
const waitingUsers=[];
const io= new Server(server)
var room=1;
let users={}
let leaderboard=[]
let countdowntimer=60*60;
setInterval(()=>
{
if(countdowntimer>0)
{ console.log(countdowntimer)
  countdowntimer--;
  io.emit("countdown",countdowntimer)
}
else
{
    countdowntimer=60*60;
}
},1000)
io.on('connection',(socket)=>
{  
    console.log(`socket connection done`)
socket.on('join',(data)=>
{
if(waitingUsers.length>0)
{    
    let rooms="room"+room;
    room++;
    const firstPerson=waitingUsers.shift();
    const secondPerson=socket;
    firstPerson.join(rooms)
    secondPerson.join(rooms);
    users[firstPerson.id]={counter:0,room:rooms,ids:firstPerson.id}
    users[secondPerson.id]={counter:0,room:rooms,ids:secondPerson.id}
   firstPerson.emit("joined",rooms)
   secondPerson.emit("joined",rooms)
//    setTimeout(() => {
//     let sockets=io.sockets.adapter.rooms.get(rooms)
// console.log(sockets)
// // const socketID_array=[...sockets]
// for(let socketId of sockets)
// {   let socket = io.sockets.sockets.get(socketId);
//     console.log("hi")
//     console.log(`${socket.id} left the room`)
//     socket.leave(rooms)
//     socket.emit('leave',"i left")
    
// }
//    }, 65000);
 
}
else{
    waitingUsers.push(socket)
    socket.emit("waiting","waiting for a another user")
}

})
socket.on("leave",(data)=>
{
    const roomUsers=Object.values(users).filter((user)=>user.room===data)
    console.log(roomUsers)
    if(roomUsers.length===2)
    {
    const winner=roomUsers.reduce((a,b)=>
    {
      return  a.counter>b.counter?a:b;
    })
  console.log(winner)
    io.to(data).emit("winner",winner.ids)
}
    console.log(socket.id)
    console.log("hello")
    socket.leave(data)
    delete users[socket.id]
    console.log("left")
})

socket.on('joinHour',()=>
{
    socket.join("hourlyroom");
})
socket.on("clicked",(data)=>
{
    users[socket.id].counter=data;
//  console.log(socket.rooms.values().next().value)
const array=[...socket.rooms]
 console.log(array[1])
let room= array[1];
if(room!==undefined)
{
 socket.to(room).emit("counter",data)
}
else{
    socket.emit("waitforanother","lets wait for another")
}
})
socket.on("disconnect",()=>
{
    console.log("disconnect")
})

//     socket.on("clicked",(data)=>
// {
//     console.log(data)
//     socket.emit("sendingdata",data)
// })
socket.on("hourCounter",(data)=>
{   
    console.log('someone competed in hour event')
        leaderboard.push({name:socket.id,counter:data})
        leaderboard.sort((a,b)=>b.counter-a.counter)
        io.to("hourlyroom").emit("leaderboard",leaderboard)
        console.log(leaderboard)

})
// const oneHour=60*60*1000;

})

app.get('/',(req,res)=>
{
    res.sendFile(path.join(__dirname,'./index.html'))
}
)
server.listen(8081,()=>
{
    console.log("server running on port 8080");
})