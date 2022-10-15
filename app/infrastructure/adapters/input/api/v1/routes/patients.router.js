const express = require('express');
const PatientMongoDBAdapter = require('../../../../output/mongodb/patient.adapter');
const router = express.Router();
const patientMongoDBAdapter = new PatientMongoDBAdapter();

router.get('/', async (req, res, next) => {
    try {
        const queryParams = req.query;
        if (Object.keys(req.query).length > 0) {
            const result = await patientMongoDBAdapter.filterDataByParams(queryParams)
            res.send(result);
        }else{
            const patients = await patientMongoDBAdapter.list();
            res.send(patients);
        }

    } catch (error) {
        next(error);
    }
});

module.exports = router;
