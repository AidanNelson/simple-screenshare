const express = require("express");
const https = require("https");
const io = require("socket.io");
const ip = require("ip");
const devcert = require("devcert");

class SignalingServer {
  constructor() {
    this.init();
  }

  async init() {
    this.app = express();
    const ssl = await devcert.certificateFor("localhost");
    this.server = https.createServer(ssl, this.app);
    this.ipAddressOnLocalNetwork = ip.address();

    // this.io = new Server(this.server);

    console.log(process.cwd() + "/src/remote");
    this.app.use(express.static(process.cwd() + "/src/remote/"));

    this.server.listen(3000, () => {
      console.log("listening on *:3000");
    });

    this.io = io();
    this.io.listen(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.io.on("connection", (socket) => {
      console.log("a user connected:" + socket.id);

      socket.emit("ip", this.ipAddressOnLocalNetwork);

      socket.broadcast.emit("intro", socket.id);

      // eslint-disable-next-line no-restricted-syntax
      for (const [id] of this.io.of("/").sockets) {
        console.log("sending intro to ", socket.id, "for", id);
        socket.emit("intro", id);
      }

      socket.on("signal", (to, from, data) => {
        this.io.to(to).emit("signal", to, from, data);
      });

      socket.on("streamEnded", () => {
        socket.broadcast.emit("streamEnded", { id: socket.id });
      });

      socket.on("doneDisplayingStream", (data) => {
        socket.broadcast.emit("doneDisplayingStream", { id: data.id });
      });

      socket.on("disconnect", () => {
        socket.broadcast.emit("peerDisconnect", { id: socket.id });
      });
    });
  }
}

module.exports = SignalingServer;
