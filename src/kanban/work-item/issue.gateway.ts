import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: 'issues',
  transports: ['websocket', 'polling'],
})
export class IssueGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(IssueGateway.name);

  afterInit() {
    this.logger.debug('IssueGateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected to IssueGateway: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected from IssueGateway: ${client.id}`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { type?: 'workspace' | 'project'; id?: string },
  ) {
    if (!body?.type || !body?.id) {
      return { ok: false };
    }

    const room = `${body.type}:${String(body.id)}`;
    client.join(room);
    return { ok: true, room };
  }

  emitIssueCreated(payload: { workspaceId?: string; projectId?: string; issue: any }) {
    this.emitToRooms('issue.created', payload);
  }

  emitIssueUpdated(payload: { workspaceId?: string; projectId?: string; issue: any }) {
    this.emitToRooms('issue.updated', payload);
  }

  emitIssueDeleted(payload: {
    workspaceId?: string;
    projectId?: string;
    issueId: string;
    title?: string;
    type?: string;
  }) {
    this.emitToRooms('issue.deleted', payload);
  }

  emitActivityCreated(payload: { workspaceId?: string; projectId?: string; activity: any }) {
    this.emitToRooms('activity.created', payload);
  }

  private emitToRooms(event: string, payload: { workspaceId?: string; projectId?: string; [k: string]: any }) {
    try {
      if (payload.workspaceId) {
        this.server.to(`workspace:${String(payload.workspaceId)}`).emit(event, payload);
      }
      if (payload.projectId) {
        this.server.to(`project:${String(payload.projectId)}`).emit(event, payload);
      }

      // Fallback for clients that have not subscribed to a room yet.
      if (!payload.workspaceId && !payload.projectId) {
        this.server.emit(event, payload);
      }
    } catch (error) {
      this.logger.error(`Failed to emit ${event}`, error as any);
    }
  }
}
