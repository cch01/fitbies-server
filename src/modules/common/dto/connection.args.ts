import { Field, InputType, Int, registerEnumType } from '@nestjs/graphql';

type ConnectionCursor = string;
type ConnectionOffsetInt = number;
type ConnectionInt = number;

@InputType()
export class ConnectionArgs {
  @Field(() => Int, { nullable: true })
  first?: ConnectionInt;

  @Field(() => String, { nullable: true })
  after?: ConnectionCursor;

  @Field(() => Int, { nullable: true })
  last?: ConnectionInt;

  @Field(() => String, { nullable: true })
  before?: ConnectionCursor;

  @Field(() => Int, { nullable: true })
  offset?: ConnectionOffsetInt;

  @Field(() => String, { nullable: true })
  sortBy?: string;

  @Field(() => SortDirection, { nullable: true })
  sortOrder?: SortDirection;
}

export enum SortDirection {
  ASC = 1,
  DESC = -1,
}
registerEnumType(SortDirection, {
  name: 'SortOrder',
});
