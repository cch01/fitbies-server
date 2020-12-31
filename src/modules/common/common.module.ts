import { Module } from '@nestjs/common';
import { SessionModule } from 'src/modules/session/session.module';
import { UserModule } from 'src/modules/user/user.module';
import { CommonResolver } from './common.resolver';
import { CommonService } from './common.service';

@Module({
  providers: [CommonService, CommonResolver]
})
export class CommonModule {}
