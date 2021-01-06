import { Model } from 'mongoose';
import {
  ConnectionArgs,
  SortDirection,
} from 'src/modules/common/dto/connection.args';
import { getPaginatedResponse } from './get.paginated.response';
import PaginationHelper from './pagination.helper';

class QueryOptions {
  query?: any;
  projection?: any;
  options?: any;
}

export async function applyConnectionArgs(
  connectionArgs: ConnectionArgs = {},
  model: Model<any>,
  opts: QueryOptions = {},
  defaultSortBy = 'createdAt',
  defaultDirection = SortDirection.DESC,
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

  const totalCount = await model
    .find({ ...opts.query }, { ...opts.projection }, { ...opts.options })
    .count();
  const crawlAll = (first || last) <= 0;

  const limit = first || last;
  const queryCursor = after || before;

  const query = {
    ...(queryCursor && {
      [`${sortBy}`]: {
        [after ? '$lt' : '$gt']: PaginationHelper.decodeCursor(queryCursor),
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

  const pageInfo = getPaginatedResponse(
    first,
    after,
    last,
    before,
    sortBy,
    sortOrder,
    results,
  );

  return {
    totalCount,
    ...pageInfo,
  };
}
