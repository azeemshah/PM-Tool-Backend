import { Controller, Get, Post, UseGuards, Request, UseInterceptors, UploadedFile, Param, Res } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { Response } from 'express';

@Controller('user')
export class UserCurrentController {
  constructor(private readonly usersService: UsersService) {}

  @Get('current')
  @UseGuards(JwtAuthGuard)
  async getCurrent(@Request() req) {
    const user = await this.usersService.findOne(req.user.userId);
    const serialized = this.usersService.serializeUser(user);

    // Return wrapped in user object with currentWorkspace for redirect
    return {
      user: {
        ...serialized,
        _id: user._id.toString(),
        currentWorkspace: user._id.toString(),
        profilePicture: user.avatar,
        name: `${user.firstName} ${user.lastName}`,
      },
    };
  }

  @Post('profile-picture')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = path.join(process.cwd(), 'uploads');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const original = file.originalname.replace(/\s+/g, '_');
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${original}`;
          cb(null, unique);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async uploadProfilePicture(@Request() req, @UploadedFile() file: any) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    const userId = req.user.userId;
    const fileUrl = `/api/v1/user/profile-picture-file/${file.filename}`;

    const updatedUser = await this.usersService.update(userId, { avatar: fileUrl });
    const serialized = this.usersService.serializeUser(updatedUser);

    return {
      message: 'Profile picture updated',
      user: {
         ...serialized,
         _id: updatedUser._id.toString(),
         profilePicture: fileUrl,
         name: `${updatedUser.firstName} ${updatedUser.lastName}`,
      }
    };
  }

  @Get('profile-picture-file/:filename')
  async getProfilePicture(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = path.join(process.cwd(), 'uploads', filename);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('File not found');
    }
  }
}
