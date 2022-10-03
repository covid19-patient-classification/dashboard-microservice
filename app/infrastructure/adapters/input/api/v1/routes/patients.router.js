const express = require('express');
const PatientMongoDBAdapter = require('../../../../output/mongodb/patient.adapter');
const router = express.Router();
const patientMongoDBAdapter = new PatientMongoDBAdapter();

router.get('/', async (req, res, next) => {
    try {
        const patients = await patientMongoDBAdapter.list();
        res.send(patients);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
