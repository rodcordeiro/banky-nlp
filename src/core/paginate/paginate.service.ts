import { z, ZodError } from 'zod';
import { Injectable } from '@nestjs/common';
import { type ObjectLiteral, Repository, type FindManyOptions } from 'typeorm';
import { BadRequestError } from '@/common/interceptors/badRequestError.interceptor';

const paginationParamSchema = z
  .union([z.string(), z.number()])
  .refine(value => {
    if (value) {
      if (typeof value === 'string') {
        const numberfyedValue = +value;

        return !Number.isNaN(numberfyedValue);
      }

      return true;
    }
    return true;
  })
  .transform(Number);

@Injectable()
export class PaginationService {
  private resolveOptions(options: IPaginationOptions) {
    try {
      const page = paginationParamSchema.default(1).parse(options.page);
      const limit = paginationParamSchema.default(10).parse(options.limit);
      const countQueries =
        typeof options.countQueries !== 'undefined'
          ? options.countQueries
          : true;
      const cacheQueries = options.cacheQueries || false;

      return { page, limit, countQueries, cacheQueries };
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestError();
      }

      throw new Error(error);
    }
  }
  private parseQueriableParams<T extends ObjectLiteral>(
    options?: FindManyOptions<T>,
  ) {
    if (!options) return {};
    return Object.fromEntries(
      Object.entries(options).filter(
        ([key, _]) => key !== 'limit' && key !== 'page',
      ),
    );
  }

  public async paginate<T extends ObjectLiteral>(
    entityRepository: Repository<T>,
    options: IPaginationOptions,
    searchOptions?: FindManyOptions<T>,
  ): Promise<Pagination<T>> {
    const { limit, page } = this.resolveOptions(options);
    console.log({ limit, page });
    const promises: [Promise<T[]>, Promise<number>] = [
      entityRepository.find({
        skip: limit * (page - 1),
        take: limit,
        ...searchOptions,
      }),

      entityRepository.count({
        ...this.parseQueriableParams(searchOptions),
      }),
    ];
    console.log('here');
    // if (countQueries) {
    //   promises[1] = entityRepository.count({
    //     ...searchOptions,
    //   });
    // }

    const [items, total] = await Promise.all(promises);
    const totalPages = Math.ceil(total / limit) || 1;
    return {
      items,
      meta: {
        currentPage: page,
        itemCount: items.length,
        itemsPerPage: limit,
        totalItems: total,
        totalPages,
        hasNext: page < totalPages,
      },
    };
  }
}
