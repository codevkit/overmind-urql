import type {
  OperationContext,
  OperationResult,
  TypedDocumentNode,
} from '@urql/core';
import { Client, ClientOptions, stringifyDocument } from '@urql/core';

export type GqlVariables = {
  [prop: string]: any;
};

type Variable = string | number | boolean | null;

interface Subscription {
  variables: { [key: string]: Variable };
  dispose: () => void;
}

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
  subscriptions?: {
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
      ? Variables extends GqlVariables
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
      ? Variables extends GqlVariables
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
      ? Variables extends GqlVariables
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
      ? Variables extends GqlVariables
        ? (
            variables?: Variables,
            context?: Partial<OperationContext>
          ) => Promise<Data>
        : never
      : never;
  };
  subscriptions: {
    [N in keyof T['subscriptions']]: T['subscriptions'][N] extends TypedDocumentNode<
      infer Data,
      infer Variables
    >
      ? Variables extends GqlVariables
        ? {
            (
              variables?: Variables,
              context?: Partial<OperationContext>
            ): (action: (result: Data) => void) => void;
            dispose(): void;
            disposeWhere(
              cb: (variables: { [variables: string]: Variable }) => boolean
            ): void;
          }
        : never
      : never;
  };
};

function createError(message: string) {
  throw new Error(`OVERMIND-URQL: ${message}`);
}

const _subscriptions: {
  [query: string]: Subscription[];
} = {};

export const graphql: <T extends Queries>(queries: T) => Graphql<T> = (
  queries
) => {
  let _client: Client;

  function getClient(): Client | null {
    return _client || null;
  }

  const evaluatedQueries = {
    rawQueries: Object.keys(queries.rawQueries || {})
      .filter((key) => key !== '__esModule') // cjs fix
      .reduce(
        (aggr, key) => {
          aggr[key] = <
            Data = any,
            Variables extends GqlVariables = GqlVariables,
          >(
            variables: Variables,
            context?: Partial<OperationContext>
          ) => {
            const query = queries.rawQueries![key];
            const client = getClient();

            if (!client) {
              throw createError(
                'You are running a query, though there is no urql client configured'
              );
            }
            return client
              .query<Data, Variables>(query, variables, context)
              .toPromise();
          };
          return aggr;
        },
        {} as {
          [key: string]: <
            Data = any,
            Variables extends GqlVariables = GqlVariables,
          >(
            variables: Variables,
            context?: Partial<OperationContext>
          ) => Promise<OperationResult<Data, Variables>>;
        }
      ),
    queries: Object.keys(queries.queries || {})
      .filter((key) => key !== '__esModule') // cjs fix
      .reduce(
        (aggr, key) => {
          aggr[key] = async <
            Data = any,
            Variables extends GqlVariables = GqlVariables,
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
              throw createError(
                'You are running a query, but there is no data'
              );
            }
            return data;
          };
          return aggr;
        },
        {} as {
          [key: string]: <
            Data = any,
            Variables extends GqlVariables = GqlVariables,
          >(
            variables: Variables,
            context?: Partial<OperationContext>
          ) => Promise<Data>;
        }
      ),
    rawMutations: Object.keys(queries.rawMutations || {})
      .filter((key) => key !== '__esModule') // cjs fix
      .reduce(
        (aggr, key) => {
          aggr[key] = <
            Data = any,
            Variables extends GqlVariables = GqlVariables,
          >(
            variables: Variables,
            context?: Partial<OperationContext>
          ) => {
            const query = queries.rawMutations![key];
            const client = getClient();

            if (!client) {
              throw createError(
                'You are running a mutation query, though there is no urql client configured'
              );
            }
            return client
              .mutation<Data, Variables>(query, variables, context)
              .toPromise();
          };
          return aggr;
        },
        {} as {
          [key: string]: <
            Data = any,
            Variables extends GqlVariables = GqlVariables,
          >(
            variables: Variables,
            context?: Partial<OperationContext>
          ) => Promise<OperationResult<Data, Variables>>;
        }
      ),
    mutations: Object.keys(queries.mutations || {})
      .filter((key) => key !== '__esModule') // cjs fix
      .reduce(
        (aggr, key) => {
          aggr[key] = async <
            Data = any,
            Variables extends GqlVariables = GqlVariables,
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
            Variables extends GqlVariables = GqlVariables,
          >(
            variables: Variables,
            context?: Partial<OperationContext>
          ) => Promise<Data>;
        }
      ),
    subscriptions: Object.keys(queries.subscriptions || {})
      .filter((key) => key !== '__esModule') // cjs fix
      .reduce(
        (aggr, key) => {
          const query = queries.subscriptions![key] as any;
          const queryString = stringifyDocument(query);
          if (!_subscriptions[queryString]) {
            _subscriptions[queryString] = [];
          }

          function subscription<
            Data = any,
            Variables extends GqlVariables = GqlVariables,
          >(variables: Variables, context?: Partial<OperationContext>) {
            return (action: (result: Data) => void) => {
              const client = getClient();
              if (!client) {
                throw createError(
                  'You are running a subscription, though there is no urql client configured'
                );
              }
              const { unsubscribe } = client
                ?.subscription(query, variables, context)
                .subscribe((result) => action(result.data));
              _subscriptions[queryString].push({
                variables,
                dispose: () => unsubscribe(),
              });
            };
          }

          subscription.dispose = () => {
            _subscriptions[queryString].forEach((sub) => {
              try {
                sub.dispose();
              } catch (e) {
                // Ignore, it probably throws an error because we weren't subscribed in the first place
              }
            });
            _subscriptions[queryString].length = 0;
          };

          subscription.disposeWhere = (
            cb: (variables: { [variables: string]: Variable }) => boolean
          ) => {
            _subscriptions[queryString] = _subscriptions[queryString].reduce<
              Subscription[]
            >((subAggr, sub) => {
              if (cb(sub.variables)) {
                try {
                  sub.dispose();
                } catch (e) {
                  // Ignore, it probably throws an error because we weren't subscribed in the first place
                }
                return subAggr;
              }
              return subAggr.concat(sub);
            }, []);
          };

          aggr[key] = subscription;

          return aggr;
        },
        {} as {
          [key: string]: {
            <Data = any, Variables extends GqlVariables = GqlVariables>(
              variables: Variables,
              context?: Partial<OperationContext>
            ): (action: (result: Data) => void) => void;
            dispose(): void;
            disposeWhere(
              cb: (variables: { [variables: string]: Variable }) => boolean
            ): void;
          };
        }
      ),
  };

  return {
    initialize(client: Client) {
      _client = client;
    },
    ...evaluatedQueries,
  } as any;
};

export * from '@urql/core';
