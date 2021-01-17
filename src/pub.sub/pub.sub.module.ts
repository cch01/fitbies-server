import { Module } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';

const pubsub = {
  provide: 'pubSub',
  useValue: new PubSub(),
};

@Module({ providers: [pubsub], exports: [pubsub] })
export class PubSubModule {}
