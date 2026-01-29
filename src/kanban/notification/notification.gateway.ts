import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    console.log('Gateway: Connection attempt', { id: client.id, userId });
    if (userId) {
      client.join(userId);
      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);
      console.log(`Gateway: User ${userId} joined room ${userId}`);
    } else {
      this.logger.warn(`Client connected without userId: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  sendNotification(userId: string, notification: any) {
    console.log(`Gateway: Sending notification to room ${userId}`, notification);
    const result = this.server.to(userId).emit('notification', notification);
    console.log(`Gateway: Emitted to ${userId}, result:`, result);
  }
}
