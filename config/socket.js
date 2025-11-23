import dotenv from "dotenv";
dotenv.config({ path: "config.env", quiet: true });
import { Server } from "socket.io";
import { verifyToken } from "../utils/verifyToken.js";

let ioInstance = null;

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.use(async (socket, next) => {
    try {
      const authHeader = socket.handshake.headers?.authorization;
      const token =
        socket.handshake.auth?.token ||
        (authHeader && authHeader.split(" ")[1]);

      const user = await verifyToken(token);
      socket.user = user;
      next();
    } catch (err) {
      console.error("🛑 Socket auth error:", err.message);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user?._id;
    const userRole = socket.user?.role;

    console.log("🟢 New client connected:", socket.id, "User:", userId);

    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`👤 User ${userId} joined room: user_${userId}`);
    }

    if (userRole) {
      socket.join(`role_${userRole}`);
      console.log(`🎭 User ${userId} joined role room: role_${userRole}`);
    }

    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected:", socket.id, "User:", userId);
    });

    socket.on("ping", () => {
      socket.emit("pong", { message: "pong", user: userId });
    });
  });

  ioInstance = io;
}

function getIo() {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized yet!");
  }
  return ioInstance;
}

export { initSocket, getIo };
