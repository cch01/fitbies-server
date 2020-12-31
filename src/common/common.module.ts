import { Module } from '@nestjs/common';
import { SessionModule } from 'src/session/session.module';
import { UserModule } from 'src/user/user.module';
import { CommonResolver } from './common.resolver';
import { CommonService } from './common.service';

@Module({
  providers: [CommonService, CommonResolver]
})
export class CommonModule {}
