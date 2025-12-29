import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseConfig {
  constructor(private configService: NestConfigService) {}

  get uri(): string {
    return this.configService.get<string>('database.uri') || 'mongodb://localhost:27017/pm-tool';
  }

  get options() {
    return {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
  }
}
