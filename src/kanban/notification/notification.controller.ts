// src/kanban/notification/notification.controller.ts
import { Controller, Get, Post, Patch, Param, Body, Delete } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Types } from 'mongoose';

@Controller('pm-kanban/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /* ================= Create Notification ================= */
  @Post()
  create(@Body() body: any) {
    return this.notificationService.create(body);
  }

  /* ================= Get User Notifications ================= */
  @Get('user/:userId')
  getUserNotifications(@Param('userId') userId: string) {
    return this.notificationService.findByUser(new Types.ObjectId(userId));
  }

  /* ================= Mark Notification as Read ================= */
  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(new Types.ObjectId(id));
  }

  /* ================= Mark All Notifications as Read ================= */
  @Patch('user/:userId/read-all')
  markAllAsRead(@Param('userId') userId: string) {
    return this.notificationService.markAllAsRead(new Types.ObjectId(userId));
  }

  /* ================= Delete All Notifications ================= */
  @Delete('user/:userId/clear-all')
  deleteAll(@Param('userId') userId: string) {
    return this.notificationService.deleteAll(new Types.ObjectId(userId));
  }

  /* ================= Delete Notification ================= */
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.notificationService.delete(new Types.ObjectId(id));
  }
}
