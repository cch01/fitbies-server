import { Resolver, Query } from '@nestjs/graphql';
import { CommonService } from './common.service';

@Resolver()
export class CommonResolver {
  constructor(private readonly commonService: CommonService) {}

  @Query((returns) => Boolean)
  async healthCheck(): Promise<boolean> {
    return this.commonService.healthCheck();
  }
}
