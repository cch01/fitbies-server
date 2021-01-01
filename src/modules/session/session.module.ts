import { Module } from '@nestjs/common';
import { SessionModel } from './session.model';
import { SessionService } from './session.service';

@Module({
  imports: [SessionModel],
  providers: [SessionService],
  exports: [SessionService, SessionModel],
})
export class SessionModule {}
