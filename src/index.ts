import { Client, ClientOptions, createClient } from '@urql/core';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { OperationContext, OperationResult } from '@urql/core/dist/types/types';

type Queries = {
  queries?: {
    [key: string]: TypedDocumentNode<any, object> | string;
  };
  mutations?: {
    [key: string]: TypedDocumentNode<any, object> | string;
  };
};

export type Graphql<T extends Queries> = {
  initialize(opts: ClientOptions): void;
} & {
  queries: {
    [N in keyof T['queries']]: T['queries'][N] extends TypedDocumentNode<
      infer D,
      infer V
    >
      ? <Data = D, Variables = V>(
          variables?: Variables,
          context?: Partial<OperationContext>
        ) => Promise<OperationResult<Data, Variables>>
      : <Data = any, Variables extends object = {}>(
          variables?: Variables,
          context?: Partial<OperationContext>
        ) => Promise<OperationResult<Data, Variables>>;
  };
  mutations: {
    [N in keyof T['mutations']]: T['mutations'][N] extends TypedDocumentNode<
      infer D,
      infer V
    >
      ? <Data = D, Variables = V>(
          variables?: Variables,
          context?: Partial<OperationContext>
        ) => Promise<OperationResult<Data, Variables>>
      : <Data = any, Variables extends object = {}>(
          variables?: Variables,
          context?: Partial<OperationContext>
        ) => Promise<OperationResult<Data, Variables>>;
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
    queries: Object.keys(queries.queries || {}).reduce(
      (aggr, key) => {
        aggr[key] = <Data = any, Variables extends object = {}>(
          variables?: Variables,
          context?: Partial<OperationContext>
        ) => {
          const query = queries.queries![key];
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
        [key: string]: <Data = any, Variables extends object = {}>(
          variables?: Variables,
          context?: Partial<OperationContext>
        ) => Promise<OperationResult<Data, Variables>>;
      }
    ),
    mutations: Object.keys(queries.mutations || {}).reduce(
      (aggr, key) => {
        aggr[key] = <Data = any, Variables extends object = {}>(
          variables?: Variables,
          context?: Partial<OperationContext>
        ) => {
          const query = queries.mutations![key];
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
        [key: string]: <Data = any, Variables extends object = {}>(
          variables?: Variables,
          context?: Partial<OperationContext>
        ) => Promise<OperationResult<Data, Variables>>;
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
