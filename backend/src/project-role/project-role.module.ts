import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectRoleController } from './project-role.controller';
import { ProjectRoleService } from './project-role.service';
import { ProjectRole, ProjectRoleSchema } from './schemas/project-role.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProjectRole.name, schema: ProjectRoleSchema },
    ]),
  ],
  controllers: [ProjectRoleController],
  providers: [ProjectRoleService],
  exports: [ProjectRoleService],
})
export class ProjectRoleModule {}
