const patientEntity = {
    identification: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    sato2: {
        type: Number,
        required: true,
    },
    pao2: {
        type: Number,
        required: true,
    },
    fio2: {
        type: Number,
        required: true,
    },
    pf_ratio: {
        type: Number,
        required: true,
    },
    respiratory_failure: Boolean,
    ards: Boolean,
    sepsis_shock: Boolean,
    sore_throat: Boolean,
    fever: Boolean,
    cough: Boolean,
    headache: Boolean,
    fatigue: Boolean,
    dyspnea: Boolean,
    nausea: Boolean,
    vomit: Boolean,
    diarrhea: Boolean,
    covid19_severity: Boolean,
    registration_date: Date,
};

module.exports = patientEntity;
