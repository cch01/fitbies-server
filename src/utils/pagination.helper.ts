import { Field, ObjectType, Int } from '@nestjs/graphql';
import { Type } from '@nestjs/common';
import { ConnectionArgs } from 'src/modules/common/dto/connection.args';
import { Model, Document } from 'mongoose';
import { ApolloError, UserInputError } from 'apollo-server-express';
import * as moment from 'moment';
import * as _ from 'lodash';
import { cpuUsage } from 'process';

export type ConnectionCursor = string;
export type ConnectionLimitInt = number;
export type ConnectionOffsetInt = number;
export type ConnectionInt = number;

export default class PaginationHelper {
  static createPaginatedSchema<T>(classRef: Type<T>): any {
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

  static async applyConnectionArgs(
    connectionArgs: ConnectionArgs = {},
    model: Model<any>,
    opts: any = {},
    defaultSortBy = 'createdAt',
    defaultDirection = -1,
  ): Promise<any> {
    const {
      first,
      sortBy = defaultSortBy,
      sortOrder = defaultDirection,
      last,
      offset = 0,
      before,
      after,
    } = connectionArgs;

    checkArgs({ after, before, first, last });

    const totalCount = await model.find(opts).count();

    const crawlAll = (first || last) <= 0;

    const limit = first || last;
    const queryCursor = after || before;

    const query = {
      ...(queryCursor && {
        [`${sortBy}`]: {
          [after ? '$lt' : '$gt']: PaginationHelper.cursorToCreateAt(
            queryCursor,
          ),
        },
      }),
      ...opts.query,
    };

    const results = await model.find(
      query,
      { ...opts.projection },
      {
        sort: { [sortBy]: before ? -sortOrder : sortOrder },
        ...(!crawlAll && { limit: limit + 1 }),
        ...(offset && { skip: offset }),
        ...opts.options,
      },
    );

    const pageInfo = getPaginatedResponse(first, after, last, before, results);

    return {
      totalCount,
      ...pageInfo,
    };
  }

  static createdAtToCursor(createdAt: string): ConnectionCursor {
    return Buffer.from(new Date(createdAt).toISOString()).toString('base64');
  }

  static cursorToCreateAt(cursor: ConnectionCursor): string {
    const createdAt = Buffer.from(cursor, 'base64').toString('ascii');
    if (!moment(createdAt).isValid()) {
      throw new ApolloError('Invalid cursor');
    }
    return new Date(createdAt).toISOString();
  }
}

function checkArgs({ after, before, first, last }: ConnectionArgs): void {
  const isForwardPaging = !!first || !!after;
  const isBackwardPaging = !!last || !!before;
  if (isForwardPaging && isBackwardPaging) {
    throw new UserInputError(
      'Relay pagination cannot be forwards AND backwards!',
    );
  }
  if ((isForwardPaging && before) || (isBackwardPaging && after)) {
    throw new UserInputError(
      'Paging must use either first/after or last/before!',
    );
  }
  if ((isForwardPaging && first < 0) || (isBackwardPaging && last < 0)) {
    throw new UserInputError('Paging limit must be positive!');
  }
  if (last && !before) {
    throw new UserInputError(
      "When paging backwards, a 'before' argument is required!",
    );
  }
}

function getPaginatedResponse(
  first: number,
  after: string,
  last: number,
  before: string,
  fetchedResult: any[],
): Record<string, unknown> {
  let nodes;
  let hasNextPage = false;
  let hasPreviousPage = false;

  if (first) {
    hasNextPage = fetchedResult.length > first;
    if (after) {
      hasPreviousPage = true;
    }
    nodes = hasNextPage ? fetchedResult.slice(0, -1) : fetchedResult;
  }

  if (last) {
    hasPreviousPage = fetchedResult.length > last;
    nodes = hasPreviousPage ? fetchedResult.slice(1) : fetchedResult;
    if (before) {
      hasNextPage = true;
      nodes = hasPreviousPage
        ? fetchedResult.reverse().slice(1)
        : fetchedResult.reverse();
    }
  }

  const edges = !!nodes
    ? nodes.map((node) => ({
        cursor: PaginationHelper.createdAtToCursor(_.get(node, 'createdAt')),
        node,
      }))
    : [];

  const dataCountInPage = edges.length ?? 0;

  const endCursor =
    nodes.length &&
    PaginationHelper.createdAtToCursor(
      _.get(nodes[nodes.length - 1], 'createdAt'),
    );

  const startCursor =
    nodes.length &&
    PaginationHelper.createdAtToCursor(_.get(nodes[0], 'createdAt'));

  return {
    hasNextPage,
    hasPreviousPage,
    nodes,
    dataCountInPage,
    endCursor,
    startCursor,
    edges,
  };
}
