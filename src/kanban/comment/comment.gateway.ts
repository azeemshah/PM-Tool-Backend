import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: 'comments',
  transports: ['websocket', 'polling'],
})
export class CommentGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CommentGateway.name);

  afterInit(server: Server) {
    this.logger.log('CommentGateway initialized');
    console.log('CommentGateway: WebSocket server initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to CommentGateway: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from CommentGateway: ${client.id}`);
  }

  emitCommentCreated(payload: { workspaceId?: string; workItemId: string; comment: any }) {
    try {
      this.server.emit('comment.created', payload);
    } catch (error) {
      console.error('CommentGateway: Error emitting comment.created', error);
    }
  }
}

