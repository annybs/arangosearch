import { Document } from 'arangojs/documents'
import { DocumentCollection } from 'arangojs/collection'
import { GeneratedAqlQuery } from 'arangojs/aql'
import { Database, aql } from 'arangojs'

/**
 * A `CountFn` function returns the number of documents in a single collection matching search `terms` given.
 *
 * `count()` provides the standard implementation.
 */
export type CountFn<T extends Searchable, S extends Searchable = T> = (
  terms?: Terms<Document<DeepNonNullable<S>>>
) => Promise<number>

/**
 * Recursively renders all of a complex object's properties required, non-null, and non-undefined.
 *
 * Note: this type recurses through objects only, not arrays.
 */
export type DeepNonNullable<T> = NonNullable<T> extends object ? { [P in keyof T]-?: DeepNonNullable<T[P]> } : T

/** Query sort direction. */
export type Direction = 'ASC' | 'DESC'

/**
 * Simple search filter type in which any number of conditions can be specified for a presumed parameter.
 *
 * Multiple operators can be used in combination.
 * By default they will be combined into an `AND` filter.
 * Specify `mode: "OR"` to switch to an `OR` filter.
 *
 * Note: `LIKE`, `NOT LIKE`, and regular expression operators are only available if `T` extends `string`.
 */
export type Filter<T> = {
  mode?: 'AND' | 'OR'
  eq?: T | null
  gt?: T
  gte?: T
  in?: T[]
  like?: T & string
  lt?: T
  lte?: T
  neq?: T | null
  nin?: T[]
  nlike?: T & string
  nreg?: T & string
  reg?: T & string
}

/**
 * A `FindFn` function returns the first document in a single collection matching search `terms` given.
 * A `sort` can be specified to control the result.
 *
 * `find()` provides the standard implementation.
 */
export type FindFn<T extends Searchable, S extends Searchable = T> = (
  terms?: Terms<Document<DeepNonNullable<S>>>,
  sort?: Sort<Document<T>>[] | Sort<Document<T>>
) => Promise<Document<T> | undefined>

/**
 * Query limit.
 * Always a tuple, but the second value can be omitted.
 */
export type Limit = [number, number?]

/**
 * Searchable data type.
 * Essentially, any object is valid.
 */
export type Searchable = Record<string, unknown>

/**
 * Formulate search terms based on a complex data type.
 * Nested object types are preserved, while scalar properties are converted to `Filter` representations.
 */
export type Terms<T> = {
  [P in keyof T]?: NonNullable<NonNullable<T[P]> extends object ? Terms<T[P]> : Filter<T[P]>>
}

/**
 * A `SearchFn` function matches documents in a single collection and returns a `SearchResult` based on the given
 * `terms`, `limit`, and `sort`.
 */
export type SearchFn<T extends Searchable, S extends Searchable = T> = (
  terms?: Terms<Document<DeepNonNullable<S>>>,
  limit?: Limit,
  sort?: Sort<Document<S>>[] | Sort<Document<S>>
) => Promise<SearchResult<T>>

/**
 * Search results are a tuple of three values:
 *   1. The **total** number of matching documents in the searched collection, ignoring limit
 *   2. The documents matched within the searched collection, respecting limit
 *   3. The AQL query object for the latter (for debugging purposes)
 */
export type SearchResult<T extends Searchable> = [number, Document<T>[], GeneratedAqlQuery]

/** Query sort order. */
export type Sort<T> = [keyof T, Direction]

/** Format scalar or scalar array data for use in AQL. */
export const formatData = <T>(data: T | T[]): string =>
  data instanceof Array ? `[${data.map(formatValue).join(',')}]` : formatValue(data)

/** Format scalar data for use in AQL. */
export const formatValue = <T>(data: T): string => {
  if (typeof data === 'string') return `"${data}"`
  if (data === null) return 'null'
  return `${data}`
}

/** Map of search operator properties to AQL equivalents. */
export const operatorMap: Record<keyof Omit<Filter<unknown>, 'mode'>, string> = {
  eq: '==',
  gt: '>',
  gte: '>=',
  in: 'IN',
  like: 'LIKE',
  lt: '<',
  lte: '<=',
  neq: '!=',
  nin: 'NOT IN',
  nlike: 'NOT LIKE',
  nreg: '!~',
  reg: '=~'
}

/** Search operators. */
export const operators = Object.keys(operatorMap)

/**
 * Parse a search limit to a string AQL limit.
 *
 * Note: `LIMIT` is not prepended.
 */
export const parseLimit = (l: Limit) => l.length > 1 ? `${l[0]}, ${l[1]}` : l[0]

/**
 * Parse a search filter to a string of AQL filters.
 *
 * Note: `FILTER` is not prepended.
 */
export const parseFilter = <T>(param: string, search: Filter<T>) => parseFilterOps(search)
  .map(([op, data]) => `${param} ${op} ${formatData(data)}`)
  .join(` ${search.mode || 'AND'} `)

/** Parse search parameter object to FILTER statement(s). */
const parseFilterOps = <T>(search: Filter<T>) =>
  (Object.keys(search) as (keyof typeof search)[]).map(key => {
    if (key === 'mode' || search[key] === undefined) return undefined
    if (operatorMap[key] === undefined) throw new Error('unrecognised search operator')
    return [operatorMap[key], search[key]]
  }).filter(Boolean) as [string, T | T[] | null][]

/**
 * Parse query sort(s) to an array of string AQL sorts.
 *
 * Note: `SORT` is not prepended.
 */
export const parseSort = <T>(s: Sort<T>[] | Sort<T>, parent: string): string[] => {
  if (s[0] instanceof Array) return (s as Sort<T>[]).map(ss => `${parent}.${String(ss[0])} ${ss[1]}`)
  return [`${parent}.${String(s[0])} ${s[1]}`]
}

/**
 * Parse search terms to a flat array of search filters.
 * The `parent` argument refers to the current document, and is prefixed to each filter.
 */
export const parseTerms = <T>(s: Terms<T>, parent: string) => (Object.keys(s) as (keyof T)[])
  .reduce((filters, param) => {
    const f = s[param]
    if (!f) return filters
    if (Object.keys(f).find(k => k !== 'mode' && !operators.includes(k))) {
      // object is nested
      filters.push(...parseTerms(f as Terms<typeof f>, `${parent}.${String(param)}`))
    }
    else {
      // object resembles a search parameter
      filters.push(parseFilter(`${parent}.${String(param)}`, f))
    }
    return filters
  }, <string[]>[])

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
export const count = <T extends Searchable, S extends Searchable = T>(
  db: Database,
  c: DocumentCollection<T>,
  i = 'i',
  n = 'n'
): CountFn<T, S> => async (terms) => {
    const filters = terms && parseTerms(terms, i)
    const filterStr = aql.literal(filters ? filters.map(f => `FILTER ${f}`).join(' ') : '')
    const l = { i: aql.literal(i), n: aql.literal(n) }

    const countQuery = aql`
      FOR ${l.i} IN ${c}
        ${filterStr}
        COLLECT WITH COUNT INTO ${l.n}
        RETURN ${l.n}
    `

    return await (await db.query(countQuery)).next()
  }

/**
 * Build and execute a find query that returns the first matching document in a single collection.
 *
 * This example resembles the generated AQL query:
 *
 * ```aql
 * FOR {i} IN {collection} {FILTER ...} {SORT ...} LIMIT 1 RETURN {i}
 * ```
 */
export const find = <T extends Searchable, S extends Searchable = T>(
  db: Database,
  c: DocumentCollection<T>,
  i = 'i'
): FindFn<T, S> => async (terms, sort = ['_key', 'ASC']) => {
    const filters = terms && parseTerms(terms, 'i')
    const filterStr = aql.literal(filters ? filters.map(f => `FILTER ${f}`).join(' ') : '')
    const sortStr = aql.literal(sort ? `SORT ${parseSort(sort, 'i').join(', ')}` : '')
    const l = { i: aql.literal(i) }

    const query = aql`
      FOR ${l.i} IN ${c}
        ${filterStr}
        ${sortStr}
        LIMIT 1
        RETURN ${l.i}
    `

    const data = await (await db.query(query)).next()
    return data
  }

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
export const search = <T extends Searchable, S extends Searchable = T>(
  db: Database,
  c: DocumentCollection<T>,
  i = 'i',
  n = 'n'
): SearchFn<T, S> => async (terms, limit, sort = ['_rev', 'ASC']) => {
    const filters = terms && parseTerms(terms, 'i')
    const filterStr = aql.literal(filters ? filters.map(f => `FILTER ${f}`).join(' ') : '')
    const limitStr = aql.literal(limit ? `LIMIT ${parseLimit(limit)}` : '')
    const sortStr = aql.literal(sort ? `SORT ${parseSort(sort, 'i').join(', ')}` : '')
    const l = { i: aql.literal(i), n: aql.literal(n) }

    let count = 0
    if (limit) {
      const countQuery = aql`
        FOR ${l.i} IN ${c}
          ${filterStr}
          COLLECT WITH COUNT INTO ${l.n}
          RETURN ${l.n}
      `
      count = await (await db.query(countQuery)).next()
    }

    const query = aql`
      FOR ${l.i} IN ${c}
        ${filterStr}
        ${sortStr}
        ${limitStr}
        RETURN ${l.i}
    `

    const data = await (await db.query(query)).all()
    if (data.length > count) count = data.length
    return [count, data, query]
  }

export default {
  count,
  find,
  formatData,
  formatValue,
  operatorMap,
  operators,
  parseFilter,
  parseLimit,
  parseSort,
  parseTerms,
  search
}
