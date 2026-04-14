import { Controller, Get, Body, Patch, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UserResponseDto } from './dto/user-response.dto';

@Controller('pm-users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Request() req: any): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(req.user.userId);
    return this.usersService.serializeUser(user);
  }

  @Patch('profile')
  async updateProfile(
    @Request() req: any,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.update(req.user.userId, updateUserDto);
    return this.usersService.serializeUser(user);
  }
}
