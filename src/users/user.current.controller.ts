import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsersService } from './users.service';
 
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
        currentWorkspace: user._id.toString(),
      },
    };
  }
}
 