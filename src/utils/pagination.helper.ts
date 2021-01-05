import { ConnectionArgs } from 'src/modules/common/dto/connection.args';
import { ApolloError, UserInputError } from 'apollo-server-express';
import * as moment from 'moment';
import * as _ from 'lodash';

export default class PaginationHelper {
  static encodeCursor(input: string): string {
    return Buffer.from(new Date(input).toISOString()).toString('base64');
  }

  static decodeCursor(cursor: string): string {
    const createdAt = Buffer.from(cursor, 'base64').toString('ascii');
    if (!moment(createdAt).isValid()) {
      throw new ApolloError('Invalid cursor');
    }
    return new Date(createdAt).toISOString();
  }

  static checkConnectionArgs({
    after,
    before,
    first,
    last,
  }: ConnectionArgs): void {
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
}
