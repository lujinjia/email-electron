const { Server } = require("socket.io");

const io = new Server(3000, {
  cors: {
    origin: "http://localhost:5173",
  }
})

export const server =  {
  emitData: (type, data) => {
    io.sockets.emit(type, data)
    console.log(type, data)
  }
}
