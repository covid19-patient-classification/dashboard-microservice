require('dotenv').config();

const config = {
    dbUrl: process.env.DATABASE_DEPLOYMENT_URL,
    env: process.env.NODE_ENV || 'dev',
    host: process.env.HOST || 'http://localhost',
    isProd: process.env.NODE_ENV === 'production',
    port: process.env.PORT || 3000,
    dateLocale: process.env.DATE_LOCALE,
    timeZone: process.env.TIME_ZONE,
};

module.exports = config;
