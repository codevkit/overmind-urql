import { Client, ClientOptions, createClient } from '@urql/core';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import {
  AnyVariables,
  OperationContext,
  OperationResult,
} from '@urql/core/dist/types/types';

type Queries = {
  rawQueries?: {
    [key: string]: TypedDocumentNode<any, any> | string;
  };
  queries?: {
    [key: string]: TypedDocumentNode<any, any> | string;
  };
  rawMutations?: {
    [key: string]: TypedDocumentNode<any, any> | string;
  };
  mutations?: {
    [key: string]: TypedDocumentNode<any, any> | string;
  };
};

export type Graphql<T extends Queries> = {
  initialize(opts: ClientOptions): void;
} & {
  rawQueries: {
    [N in keyof T['rawQueries']]: T['rawQueries'][N] extends TypedDocumentNode<
      infer Data,
      infer Variables
    >
      ? Variables extends AnyVariables
        ? (
            variables?: Variables,
            context?: Partial<OperationContext>
          ) => OperationResult<Data, Variables>
        : never
      : never;
  };
  queries: {
    [N in keyof T['queries']]: T['queries'][N] extends TypedDocumentNode<
      infer Data,
      infer Variables
    >
      ? Variables extends AnyVariables
        ? (
            variables?: Variables,
            context?: Partial<OperationContext>
          ) => Promise<Data>
        : never
      : never;
  };
  rawMutations: {
    [N in keyof T['rawMutations']]: T['rawMutations'][N] extends TypedDocumentNode<
      infer Data,
      infer Variables
    >
      ? Variables extends AnyVariables
        ? (
            variables?: Variables,
            context?: Partial<OperationContext>
          ) => Promise<OperationResult<Data, Variables>>
        : never
      : never;
  };
  mutations: {
    [N in keyof T['mutations']]: T['mutations'][N] extends TypedDocumentNode<
      infer Data,
      infer Variables
    >
      ? Variables extends AnyVariables
        ? (
            variables?: Variables,
            context?: Partial<OperationContext>
          ) => Promise<Data>
        : never
      : never;
  };
};

function createError(message: string) {
  throw new Error(`OVERMIND-URQL: ${message}`);
}

const _clients: { [url: string]: Client } = {};

export const graphql: <T extends Queries>(
  queries: T
) => Graphql<T> = queries => {
  let _opts: ClientOptions;

  function getClient(): Client | null {
    if (_opts) {
      if (!_clients[_opts.url]) {
        _clients[_opts.url] = createClient(_opts);
      }

      return _clients[_opts.url];
    }

    return null;
  }

  const evaluatedQueries = {
    rawQueries: Object.keys(queries.rawQueries || {}).reduce(
      (aggr, key) => {
        aggr[key] = <Data = any, Variables extends AnyVariables = AnyVariables>(
          variables: Variables,
          context?: Partial<OperationContext>
        ) => {
          const query = queries.rawQueries![key];
          const client = getClient();

          if (client) {
            return client
              .query<Data, Variables>(query, variables, context)
              .toPromise();
          }

          throw createError(
            'You are running a query, though there is no urql client configured'
          );
        };
        return aggr;
      },
      {} as {
        [key: string]: <
          Data = any,
          Variables extends AnyVariables = AnyVariables
        >(
          variables: Variables,
          context?: Partial<OperationContext>
        ) => Promise<OperationResult<Data, Variables>>;
      }
    ),
    queries: Object.keys(queries.queries || {}).reduce(
      (aggr, key) => {
        aggr[key] = async <
          Data = any,
          Variables extends AnyVariables = AnyVariables
        >(
          variables: Variables,
          context?: Partial<OperationContext>
        ) => {
          const query = queries.queries![key];
          const client = getClient();

          if (!client) {
            throw createError(
              'You are running a query, though there is no urql client configured'
            );
          }
          const { data, error } = await client
            .query<Data, Variables>(query, variables, context)
            .toPromise();
          if (error) {
            throw error;
          }
          if (!data) {
            throw createError('You are running a query, but there is no data');
          }
          return data;
        };
        return aggr;
      },
      {} as {
        [key: string]: <
          Data = any,
          Variables extends AnyVariables = AnyVariables
        >(
          variables: Variables,
          context?: Partial<OperationContext>
        ) => Promise<Data>;
      }
    ),
    rawMutations: Object.keys(queries.rawMutations || {}).reduce(
      (aggr, key) => {
        aggr[key] = <Data = any, Variables extends AnyVariables = AnyVariables>(
          variables: Variables,
          context?: Partial<OperationContext>
        ) => {
          const query = queries.rawMutations![key];
          const client = getClient();

          if (client) {
            return client
              .mutation<Data, Variables>(query, variables, context)
              .toPromise();
          }

          throw createError(
            'You are running a mutation query, though there is no urql client configured'
          );
        };
        return aggr;
      },
      {} as {
        [key: string]: <
          Data = any,
          Variables extends AnyVariables = AnyVariables
        >(
          variables: Variables,
          context?: Partial<OperationContext>
        ) => Promise<OperationResult<Data, Variables>>;
      }
    ),
    mutations: Object.keys(queries.mutations || {}).reduce(
      (aggr, key) => {
        aggr[key] = async <
          Data = any,
          Variables extends AnyVariables = AnyVariables
        >(
          variables: Variables,
          context?: Partial<OperationContext>
        ) => {
          const query = queries.mutations![key];
          const client = getClient();

          if (!client) {
            throw createError(
              'You are running a mutation query, though there is no urql client configured'
            );
          }
          const { data, error } = await client
            .mutation<Data, Variables>(query, variables, context)
            .toPromise();
          if (error) {
            throw error;
          }
          if (!data) {
            throw createError(
              'You are running a mutation query, but there is no data'
            );
          }
          return data;
        };
        return aggr;
      },
      {} as {
        [key: string]: <
          Data = any,
          Variables extends AnyVariables = AnyVariables
        >(
          variables: Variables,
          context?: Partial<OperationContext>
        ) => Promise<Data>;
      }
    ),
  };

  return {
    initialize(opts: ClientOptions) {
      _opts = opts;
    },
    ...evaluatedQueries,
  } as any;
};

export * from '@urql/core';
