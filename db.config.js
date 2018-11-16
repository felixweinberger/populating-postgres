const { Pool } = require('pg');
const faker = require('faker');

// /* global TEST_ENV */
const db = new Pool({ database: 'trailblazers_reviews' });
// typeof TEST_ENV !== 'undefined'
//   ? new Pool({ database: 'trailblazers_reviews' })
//   : new Pool({ database: 'ebdb' });

const createQueryStr = `
  CREATE TABLE reviews (
    id serial, product_id int, rating int,
    reviewer varchar(255), title varchar(255), body text,
    recommend boolean, helpful int, unhelpful int, posting_date date,
    PRIMARY KEY (id)
  );`;
const insertQueryText = `
  COPY INTO reviews (
    product_id, rating, reviewer, title, body, recommend, helpful, unhelpful, posting_date
  ) VALUES (
       $1,       $2,      $3,      $4,   $5,    $6,        $7,       $8,     $9
  )`;

const bellcurveNumber = (min, max) => {
  let result = 0;
  for (let i = 0; i < 3; i++) {
    result += faker.random.number({ max, min });
  }
  result = Math.round(result / 3);

  return result;
};

const insertPlaceholderData = (client, res) => {
  for (let i = 1; i < 100; i++) {
    if (Math.random() < 0.95 && i < 100) {
      i--;
    }
    const insertQueryValues = [
      i,
      bellcurveNumber(1, 5),
      faker.internet.userName(),
      faker.lorem.sentence(),
      faker.lorem.paragraph(5),
      faker.random.boolean(),
      faker.random.number(47),
      faker.random.number(22),
      faker.date.past(5),
    ];

    client.query(insertQueryText, insertQueryValues, () => {
      if (i === 99) {
        client.query('COMMIT', () => {
          client.end();
          res(true);
        });
      }
    });
  }
};

const initReviewsTable = () => {
  const setupTablePromise = new Promise(res => {
    db.connect((connectionErr, client) => {
      client.query('BEGIN').then(() => {
        client
          .query('DROP TABLE reviews')
          .then(() => client.query(createQueryStr))
          .then(() => insertPlaceholderData(client, res));
      });
    });
  });

  return setupTablePromise;
};

initReviewsTable();

module.exports = initReviewsTable;
