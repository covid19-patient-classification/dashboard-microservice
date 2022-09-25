const express = require('express');
const routerApi = require('./infrastructure/adapters/input/api/v1/routes');

const app = express();
const port = process.env.PORT || 3000;

// Json Middelware
app.use(express.json());

routerApi(app);


app.listen(port, () => {
  console.log('My port ' + port);
});
