# trollo-backend
Backend for the Trello clone - Trollo, a maturita project

### Instructions:
1. go to the project folder and type `yarn` or `npm install` to install all dependencies
2. create a postgres database on localhost, then put the credentials in knexfile.ts
3. run `knex migrate:latest` to create the database schema
4. (optional) run `knex seed:run` to initialize database with mock data
5. run app in dev environment using `yarn run start:dev` or `npm run start:dev`