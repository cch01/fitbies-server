import { Type } from '@nestjs/common';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Document } from 'mongoose';

export type ConnectionCursor = string;
export type ConnectionLimitInt = number;
export type ConnectionOffsetInt = number;
export type ConnectionInt = number;

export function Paginated<T>(classRef: Type<T>): any {
  @ObjectType(`${classRef.name}Edge`)
  abstract class EdgeType {
    @Field((type) => String)
    cursor: ConnectionCursor;

    @Field((type) => classRef)
    node: Document<T>;
  }

  @ObjectType({ isAbstract: true })
  abstract class PaginatedType {
    @Field((type) => [EdgeType], { nullable: true })
    edges?: EdgeType[] | void[];

    @Field((type) => [classRef], { nullable: true })
    nodes?: Document<T>[] | void[];

    @Field(() => String, { nullable: true })
    endCursor?: ConnectionCursor;

    @Field(() => String, { nullable: true })
    startCursor?: ConnectionCursor;

    @Field(() => Boolean, { nullable: true })
    hasPreviousPage?: boolean;

    @Field((type) => Boolean, { nullable: true })
    hasNextPage?: boolean;

    @Field((type) => Int, { nullable: true })
    totalCount?: number;

    @Field((type) => Int, { nullable: true })
    dataCountInPage?: number;
  }
  return PaginatedType;
}
