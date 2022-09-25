const express = require('express');
const PatientMongoDBAdapter = require('../../../../output/mongodb/patient.adapter');
const router = express.Router();
const service = new PatientMongoDBAdapter();

router.get('/', (req, res, next) => {
  try {
    res.json(service.getAllData());
  } catch (error) {
    next(error);
  }
});


module.exports = router;
