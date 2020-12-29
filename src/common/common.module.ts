import { Module } from '@nestjs/common';
import { CommonResolver } from './common.resolver';
import { CommonService } from './common.service';

@Module({
  providers: [CommonService, CommonResolver]
})
export class CommonModule {}
