# arangosearch

**Single-collection search for ArangoJS**

## Documentation

All types, constants and functions are exported from [lib](./lib/index.ts). They are fully commented, so the code is your best reference.

However, some key features are outlined below with examples to help guide your own implementation.

### Search

`arangosearch.search()` provides two values:

1. The total number of matched documents ignoring the search limit (here, `totalCount`)
2. An array of matched documents, respecting the search limit (here, `pupils`)

```js
const { Database } = require('arangojs')
const { search } = require('arangosearch')

const db = new Database({ url: 'arangodb://127.0.0.1:8529', databaseName: 'school' })
search(db, db.collection('pupils'))(
  {
    age: { gte: 9, lt: 12 },
    firstName: { like: 'B%' }
  },
  [5, 0],
  [['age', 'ASC'], ['firstName': 'ASC']]
)
  .then(([totalCount, pupils]) => {
    console.log(`Found ${totalCount} pupils aged 9-11 whose first name begins with B. Showing 1-5:`)
    pupils.forEach(pupil => console.log(pupil))
  })
  .catch(err => console.log(err))
```

### Find

`arangosearch.find()` retrieves the first matching document.

```js
import { Database } from 'arangojs'
import { find } from 'arangosearch'

const db = new Database({ url: 'arangodb://127.0.0.1:8529', databaseName: 'office' })
find(db, db.collection('staff'))(
  {
    age: { gte: 9, lt: 12 },
    firstName: { like: 'B%' }
  },
  [['age', 'ASC'], ['firstName': 'ASC']]
)
  .then(staff => {
    console.log(`Youngest member of staff aged 9-11 whose first name begins with B:`, staff)
  })
  .catch(err => console.log(err))
```

### Count

`arangosearch.count()` retrieves the number of matching documents.

```js
import { Database } from 'arangojs'
import { count } from 'arangosearch'

const db = new Database({ url: 'arangodb://127.0.0.1:8529', databaseName: 'courthouse' })
count(db, db.collection('lawyers'))({
  age: { gte: 9, lt: 12 },
  firstName: { like: 'B%' }
})
  .then(count => {
    console.log(`Found ${count} lawyers aged 9-11 whose first name begins with B`)
  })
  .catch(err => console.log(err))
```

### Renaming query parameters

The main `search`, `find`, and `count` functions accept additional string parameters for `i` and `n`, which reflect respectively the current document and, as applicable, the number of matches.

By default these are simply `'i'` and `'n'` but if for whatever reason you want to change these, you can:

```js
const [totalCount, pilots] = await search(db, db.collection('truckDrivers'), 'x', 'f')({
  age: { gte: 9, lt: 12 },
  firstName: { like: 'B%' }
})
// This produces something like "FOR x IN truckDrivers..."
```

## TypeScript

arangosearch is fully implemented in TypeScript and many of its functions are generic. For example:

```ts
const [totalCount, pilots] = await count<Pilot>(db, db.collection('pilots'))({
  age: { gte: 9, lt: 12 },
  firstName: { like: 'B%' }
})
```

## Debugging and Testing

In case you need it, the `search` function actually returns three values; the third is the AQL query that is executed. If something seems wrong with your query, this may help explain why.

Tests are [work in progress](./tests). Run `npm test` to give them a whirl.

Please feel welcome to report any issues you encounter in [GitHub issues](https://github.com/annybs/arangosearch/issues).

## License

[MIT](https://mit-license.org/)

> Copyright © 2022 Aneurin \"Anny\" Barker Snook
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
