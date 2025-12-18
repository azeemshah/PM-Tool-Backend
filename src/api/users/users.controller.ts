import {
  Controller,
  Get,
  Patch,
  Post,
  Put,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UseFilters,
  UploadedFile,
  BadRequestException,
  Query,
  Param
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from 'src/dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import * as path from 'path';
import * as fs from 'fs';
import { getUploadPath } from 'src/config/upload-paths';
import { avatarFilter } from 'src/filters/avatar-upload.filter';
import { UserType } from 'src/enum';
import { UserTypes } from '../auth/decorators/user_types.decorator';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UpdateUserDto } from 'src/dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async me(@Req() req: any) {
    console.log('Fetching profile for user ID:', req.user);
    return this.usersService.getById(req.user._id);
  }

@Get()
@UserTypes(UserType.ORGANIZATION)
async list(
  @Req() req: any,
  @Query('page') page = '1',
  @Query('limit') limit = '10',
  @Query('search') search?: string,
) {
  return this.usersService.list(
    req.user.organization_id, 
    Number(page), 
    Number(limit), 
    search
  );
}


  @Post('create')
  @UserTypes(UserType.ORGANIZATION)
  async create(@Req() req: any, @Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(req.user.organization_id, createUserDto);
  }

  @Put('update/:id')
  @UserTypes(UserType.ORGANIZATION)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Patch('toggle/:id')
  @UserTypes(UserType.ORGANIZATION)
  async toggle(@Param('id') id: string) {
    return this.usersService.toggle(id);
  }


  @Patch('me')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 }, 
      fileFilter: avatarFilter,
    }),
  )
  async updateProfile(
    @Req() req: any,
    @Body() updateProfileDto: UpdateProfileDto,
    @UploadedFile() avatarFile?: Express.Multer.File,
  ) {
    const errorMessages: { avatar?: string[] } = {};

    // ✅ Validate file if uploaded
    if (req.fileValidationError) {
      errorMessages.avatar = [req.fileValidationError];
    }

    if (errorMessages.avatar) {
      throw new BadRequestException({
        message: 'The given data was invalid.',
        errors: errorMessages,
      });
    }

    const dtoObj = plainToInstance(UpdateProfileDto, updateProfileDto);

    const errors = await validate(dtoObj);
    if (errors.length > 0) {
      const formattedErrors: Record<string, string[]> = {};
      errors.forEach((error) => {
        if (!error.constraints) return;
        formattedErrors[error.property] = Object.values(error.constraints);
      });

      throw new BadRequestException({
        message: 'The given data was invalid.',
        errors: formattedErrors,
      });
    }

    const updatedData: Partial<UpdateProfileDto & { avatar?: string | null }> =
      {
        ...updateProfileDto,
      };

    if (avatarFile) {
      const filename = `avatar-${Date.now()}${path.extname(avatarFile.originalname)}`;
      const filePath = path.join(`./${getUploadPath('avatars')}`, filename);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, avatarFile.buffer);
      updatedData.avatar = filename;

      const user = await this.usersService.getById(req.user._id);
      if (user.avatar) {
        const oldFilePath = path.join(
          `./${getUploadPath('avatars')}`,
          user.avatar,
        );
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
    } else {
      updatedData.avatar = null;
    }

    return await this.usersService.updateProfile(
      req.user._id,
      updatedData as UpdateProfileDto,
    );
  }
}
