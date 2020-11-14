### Installation

Requires [Node.js](https://nodejs.org/) v4+  and [MongoDB](https://docs.mongodb.com/manual/installation/) to run.

Install the dependencies and start the server.

```sh
$ npm install
$ node app.js
```

For production environments, first pull to make sure production is up-to-date, then use pm2 to run the service in background.

```sh
$ git pull origin main
$ pm2 restart app.js
```

### Documentation
See [Google Doc](https://docs.google.com/document/d/1VSxvATrsAjAaZqnpWm3eNhGT6C9tL7cLDIxzC0LnS8s/edit)
