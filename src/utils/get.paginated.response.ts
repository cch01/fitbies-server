import PaginationHelper from './pagination.helper';
import * as _ from 'lodash';
import { SortDirection } from 'src/modules/common/dto/connection.args';

export function getPaginatedResponse(
  first: number,
  after: string,
  last: number,
  before: string,
  sortBy: string,
  sortOrder: SortDirection,
  fetchedResult: any[],
): Record<string, unknown> {
  let nodes;
  let hasNextPage = false;
  let hasPreviousPage = false;

  PaginationHelper.checkConnectionArgs({ after, before, first, last });

  hasNextPage = first && fetchedResult.length > first;
  if (after) {
    hasPreviousPage = true;
  }
  nodes = hasNextPage ? fetchedResult.slice(0, -1) : fetchedResult;

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
        cursor: PaginationHelper.encodeToCursor(
          _.get(node, sortBy ?? 'createdAt'),
        ),
        node,
      }))
    : [];

  const dataCountInPage = edges.length ?? 0;

  const endCursor =
    nodes?.length &&
    PaginationHelper.encodeToCursor(
      _.get(nodes[nodes.length - 1], sortBy ?? 'createdAt'),
    );

  const startCursor =
    nodes?.length &&
    PaginationHelper.encodeToCursor(_.get(nodes[0], sortBy ?? 'createdAt'));

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
