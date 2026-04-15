import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: true, // Allow all origins with credentials
    credentials: true,
  },
  namespace: 'notifications',
  transports: ['websocket', 'polling'],
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  afterInit(server: Server) {
    this.logger.debug('NotificationGateway initialized');
  }

  handleConnection(client: Socket) {
    try {
      const userId = client.handshake.query.userId as string;

      if (userId) {
        // Ensure userId is a string
        const roomName = String(userId);
        client.join(roomName);

        // Emit a welcome event to verify connection
        client.emit('welcome', { message: 'Connected to notification service' });
      } else {
        this.logger.warn(`Client connected without userId: ${client.id}`);
        // Do not disconnect immediately, allow debugging
        // client.disconnect();
      }
    } catch (error) {
      console.error('Gateway: Error in handleConnection', error);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  sendNotification(userId: string, notification: any) {
    try {
      const roomName = String(userId);

      // Emit to the room regardless of size check (socket.io handles empty rooms fine)
      // This ensures we don't falsely block delivery if size check is flaky
      this.server.to(roomName).emit('notification', notification);
    } catch (error) {
      console.error('Gateway: Error in sendNotification', error);
    }
  }
}
