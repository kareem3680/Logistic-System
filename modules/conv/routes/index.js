import conversationRoutes from "./conversationRoutes.js";
import messageRoutes from "./messageRoutes.js";

export const mountRoutes = (app) => {
  app.use("/api/v1/chat/conversations", conversationRoutes);
  app.use("/api/v1/chat/messages", messageRoutes);
};

export default mountRoutes;
