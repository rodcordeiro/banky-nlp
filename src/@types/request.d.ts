import { FastifyRequest } from 'fastify';
import { UsersEntity } from '@/modules/users/entities/users.entity';

declare global {
  export type AuthenticatedRequest = {
    user: UsersEntity;
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  } & FastifyRequest;
  export interface JwtPayload {
    payload: string;
    nbf: number;
    exp: number;
    iat: number;
  }
  // export interface Message {
  //   data: {
  //     content: string;
  //   };
  //   metadata: {
  //     author: string;
  //     createdAt: string;
  //     to: string;
  //   };
  // }
}

export {};
