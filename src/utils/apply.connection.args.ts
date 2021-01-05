import { Model } from 'mongoose';
import { ConnectionArgs } from 'src/modules/common/dto/connection.args';
import { getPaginatedResponse } from './get.paginated.response';
import PaginationHelper from './pagination.helper';

export async function applyConnectionArgs(
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

  const totalCount = await model.find(opts).count();

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

  const pageInfo = getPaginatedResponse(first, after, last, before, results);

  return {
    totalCount,
    ...pageInfo,
  };
}
