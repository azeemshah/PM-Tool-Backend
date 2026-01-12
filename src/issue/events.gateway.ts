import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Socket.IO Gateway for real-time issue events
 * Emits events when issues are created, updated, or deleted
 * Clients connect and subscribe to workspace/project rooms
 */
@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5000',
    credentials: true,
  },
  namespace: '/issues',
})
export class IssueEventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private readonly logger = new Logger('IssueEventsGateway');

  afterInit(server: Server) {
    this.logger.log('✅ Socket.IO Gateway initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`✅ Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`❌ Client disconnected: ${client.id}`);
  }

  /**
   * Emit issue created event
   * Payload: { id, projectId, workspaceId, key, type, title, status }
   */
  emitIssueCreated(payload: {
    id: string;
    projectId: string;
    workspaceId: string;
    key: string;
    type: string;
    title: string;
    status: string;
  }) {
    // Broadcast to all clients in the workspace room
    this.server.to(`workspace:${payload.workspaceId}`).emit('issue.created', payload);
    this.server.to(`project:${payload.projectId}`).emit('issue.created', payload);
  }

  /**
   * Emit issue updated event
   * Payload: { id, projectId, workspaceId, key, type, title, status, changes }
   */
  emitIssueUpdated(payload: {
    id: string;
    projectId: string;
    workspaceId: string;
    key: string;
    type: string;
    title: string;
    status: string;
    changes?: Record<string, any>;
  }) {
    this.server.to(`workspace:${payload.workspaceId}`).emit('issue.updated', payload);
    this.server.to(`project:${payload.projectId}`).emit('issue.updated', payload);
  }

  /**
   * Emit issue deleted event
   * Payload: { id, projectId, workspaceId, key }
   */
  emitIssueDeleted(payload: { id: string; projectId: string; workspaceId: string; key: string }) {
    this.server.to(`workspace:${payload.workspaceId}`).emit('issue.deleted', payload);
    this.server.to(`project:${payload.projectId}`).emit('issue.deleted', payload);
  }

  /**
   * Subscribe a client to workspace updates
   * Client should call: socket.emit('subscribe', { type: 'workspace', id: workspaceId })
   */
  subscribeToWorkspace(client: Socket, workspaceId: string) {
    const room = `workspace:${workspaceId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to ${room}`);
  }

  /**
   * Subscribe a client to project updates
   * Client should call: socket.emit('subscribe', { type: 'project', id: projectId })
   */
  subscribeToProject(client: Socket, projectId: string) {
    const room = `project:${projectId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to ${room}`);
  }
}
