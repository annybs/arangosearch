import { Database } from 'arangojs'
import { DocumentMetadata } from 'arangojs/documents'
import { expect } from 'chai'
import lib from '../lib'

const testData: Record<string, (Pick<DocumentMetadata, '_key'> & Record<string, unknown>)[]> = {
  pets: [
    { _key: 'greedo', name: 'Greedo', age: 5, species: 'cat' },
    { _key: 'haribo', name: 'Haribo', age: 1.5, species: 'dog' },
    { _key: 'iguana', name: 'Iguana', age: 3, species: 'dog' },
    { _key: 'jerkins', name: 'Jerkins', age: 15, species: 'cat' },
    { _key: 'kahlua', name: 'Kahlua', age: 0.5, species: 'hamster' },
    { _key: 'lemonade', name: 'Lemonade', age: 9, species: 'dog' }
  ],
  staff: [
    { _key: 'aaron', name: 'Aaron', age: 38 },
    { _key: 'benedict', name: 'Benedict', age: 25 },
    { _key: 'cheryl', name: 'Cheryl', age: 34 },
    { _key: 'davide', name: 'Davide', age: 52 },
    { _key: 'emma', name: 'Emma', age: 23 },
    { _key: 'frank', name: 'Frank', age: 47 }
  ]
}

const getDatabase = async () => {
  let db = new Database({
    url: 'arangodb://127.0.0.1:8529'
  })
  if (!await db.database('arangosearch').exists()) {
    await db.createDatabase('arangosearch')
  }
  db = db.database('arangosearch')
  await installTestData(db)
  return db
}

const installTestData = async (db: Database) => {
  for (const c in testData) {
    const collection = db.collection(c)
    if (!await collection.exists()) {
      await db.createCollection(c)
      await collection.saveAll(testData[c], { overwriteMode: 'ignore' })
    }
  }
}

describe('count()', () => {
  for (const c in testData) {
    describe(c, () => {
      const expected = testData[c].length
      it(`should match ${expected} documents`, async () => {
        const db = await getDatabase()
        const count = await lib.count(db, db.collection(c))()
        expect(count).to.equal(expected)
      })
    })
  }
})

describe('count({ age: { gt: 5 }})', () => {
  for (const c in testData) {
    describe(c, () => {
      const expected = testData[c].filter(i => i.age && i.age > 5).length
      it(`should match ${expected} documents`, async () => {
        const db = await getDatabase()
        const count = await lib.count(db, db.collection(c))({
          age: { gt: 5 }
        })
        expect(count).to.equal(expected)
      })
    })
  }
})

describe('count({ name: { eq: "Iguana" }})', () => {
  for (const c in testData) {
    describe(c, () => {
      const expected = testData[c].filter(i => i.name === 'Iguana').length
      it(`should match ${expected} documents`, async () => {
        const db = await getDatabase()
        const count = await lib.count(db, db.collection(c))({
          name: { eq: 'Iguana' }
        })
        expect(count).to.equal(expected)
      })
    })
  }
})
