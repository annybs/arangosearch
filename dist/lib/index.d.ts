import { Document } from 'arangojs/documents';
import { DocumentCollection } from 'arangojs/collection';
import { GeneratedAqlQuery } from 'arangojs/aql';
import { Database } from 'arangojs';
/**
 * A `CountFn` function returns the number of documents in a single collection matching search `terms` given.
 *
 * `count()` provides the standard implementation.
 */
export declare type CountFn<T extends Searchable, S extends Searchable = T> = (terms?: Terms<Document<DeepNonNullable<S>>>) => Promise<number>;
/**
 * Recursively renders all of a complex object's properties required, non-null, and non-undefined.
 *
 * Note: this type recurses through objects only, not arrays.
 */
export declare type DeepNonNullable<T> = NonNullable<T> extends object ? {
    [P in keyof T]-?: DeepNonNullable<T[P]>;
} : T;
/** Query sort direction. */
export declare type Direction = 'ASC' | 'DESC';
/**
 * Simple search filter type in which any number of conditions can be specified for a presumed parameter.
 *
 * Multiple operators can be used in combination.
 * By default they will be combined into an `AND` filter.
 * Specify `mode: "OR"` to switch to an `OR` filter.
 *
 * Note: `LIKE`, `NOT LIKE`, and regular expression operators are only available if `T` extends `string`.
 */
export declare type Filter<T> = {
    mode?: 'AND' | 'OR';
    eq?: T | null;
    gt?: T;
    gte?: T;
    in?: T[];
    like?: T & string;
    lt?: T;
    lte?: T;
    neq?: T | null;
    nin?: T[];
    nlike?: T & string;
    nreg?: T & string;
    reg?: T & string;
};
/**
 * A `FindFn` function returns the first document in a single collection matching search `terms` given.
 * A `sort` can be specified to control the result.
 *
 * `find()` provides the standard implementation.
 */
export declare type FindFn<T extends Searchable, S extends Searchable = T> = (terms?: Terms<Document<DeepNonNullable<S>>>, sort?: Sort<Document<T>>[] | Sort<Document<T>>) => Promise<Document<T> | undefined>;
/**
 * Query limit.
 * Always a tuple, but the second value can be omitted.
 */
export declare type Limit = [number, number?];
/**
 * Searchable data type.
 * Essentially, any object is valid.
 */
export declare type Searchable = Record<string, unknown>;
/**
 * Formulate search terms based on a complex data type.
 * Nested object types are preserved, while scalar properties are converted to `Filter` representations.
 */
export declare type Terms<T> = {
    [P in keyof T]?: NonNullable<NonNullable<T[P]> extends object ? Terms<T[P]> : Filter<T[P]>>;
};
/**
 * A `SearchFn` function matches documents in a single collection and returns a `SearchResult` based on the given
 * `terms`, `limit`, and `sort`.
 */
export declare type SearchFn<T extends Searchable, S extends Searchable = T> = (terms?: Terms<Document<DeepNonNullable<S>>>, limit?: Limit, sort?: Sort<Document<T>>[] | Sort<Document<T>>) => Promise<SearchResult<T>>;
/**
 * Search results are a tuple of three values:
 *   1. The **total** number of matching documents in the searched collection, ignoring limit
 *   2. The documents matched within the searched collection, respecting limit
 *   3. The AQL query object for the latter (for debugging purposes)
 */
export declare type SearchResult<T extends Searchable> = [number, Document<T>[], GeneratedAqlQuery];
/** Query sort order. */
export declare type Sort<T> = [keyof T, Direction];
/** Format scalar or scalar array data for use in AQL. */
export declare const formatData: <T>(data: T | T[]) => string;
/** Format scalar data for use in AQL. */
export declare const formatValue: <T>(data: T) => string;
/** Map of search operator properties to AQL equivalents. */
export declare const operatorMap: Record<keyof Omit<Filter<unknown>, 'mode'>, string>;
/** Search operators. */
export declare const operators: string[];
/**
 * Parse a search limit to a string AQL limit.
 *
 * Note: `LIMIT` is not prepended.
 */
export declare const parseLimit: (l: Limit) => string | number;
/**
 * Parse a search filter to a string of AQL filters.
 *
 * Note: `FILTER` is not prepended.
 */
export declare const parseFilter: <T>(param: string, search: Filter<T>) => string;
/**
 * Parse query sort(s) to an array of string AQL sorts.
 *
 * Note: `SORT` is not prepended.
 */
export declare const parseSort: <T>(s: Sort<T> | Sort<T>[], parent: string) => string[];
/**
 * Parse search terms to a flat array of search filters.
 * The `parent` argument refers to the current document, and is prefixed to each filter.
 */
export declare const parseTerms: <T>(s: Terms<T>, parent: string) => string[];
/**
 * Build and execute a count query that matches documents in a single collection.
 * Returns the total number of matches.
 *
 * This example resembles the generated AQL query:
 *
 * ```aql
 * FOR {i} IN {c} {FILTER ...} COLLECT WITH COUNT INTO {n} RETURN {n}
 * ```
 */
export declare const count: <T extends Searchable, S extends Searchable = T>(db: Database, c: DocumentCollection<T>, i?: string, n?: string) => CountFn<T, S>;
/**
 * Build and execute a find query that returns the first matching document in a single collection.
 *
 * This example resembles the generated AQL query:
 *
 * ```aql
 * FOR {i} IN {collection} {FILTER ...} {SORT ...} LIMIT 1 RETURN {i}
 * ```
 */
export declare const find: <T extends Searchable, S extends Searchable = T>(db: Database, c: DocumentCollection<T>, i?: string) => FindFn<T, S>;
/**
 * Build and execute a search query across a single collection.
 * Returns a `SearchResult` tuple containing the total number of matches (ignoring limit), all matching documents
 * (respecting limit), and the AQL query.
 *
 * This example resembles the generated AQL query:
 *
 * ```aql
 * FOR {i} IN {collection} {FILTER ...} {SORT ...} {LIMIT ...} RETURN {i}
 * ```
 */
export declare const search: <T extends Searchable, S extends Searchable = T>(db: Database, c: DocumentCollection<T>, i?: string, n?: string) => SearchFn<T, S>;
declare const _default: {
    count: <T extends Searchable, S extends Searchable = T>(db: Database, c: DocumentCollection<T>, i?: string, n?: string) => CountFn<T, S>;
    find: <T_1 extends Searchable, S_1 extends Searchable = T_1>(db: Database, c: DocumentCollection<T_1>, i?: string) => FindFn<T_1, S_1>;
    formatData: <T_2>(data: T_2 | T_2[]) => string;
    formatValue: <T_3>(data: T_3) => string;
    operatorMap: Record<"eq" | "gt" | "gte" | "in" | "like" | "lt" | "lte" | "neq" | "nin" | "nlike" | "nreg" | "reg", string>;
    operators: string[];
    parseFilter: <T_4>(param: string, search: Filter<T_4>) => string;
    parseLimit: (l: Limit) => string | number;
    parseSort: <T_5>(s: Sort<T_5> | Sort<T_5>[], parent: string) => string[];
    parseTerms: <T_6>(s: Terms<T_6>, parent: string) => string[];
    search: <T_7 extends Searchable, S_2 extends Searchable = T_7>(db: Database, c: DocumentCollection<T_7>, i?: string, n?: string) => SearchFn<T_7, S_2>;
};
export default _default;
