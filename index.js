require('dotenv').config();
const dev = require('./src/dev');

exports.handler = async (event) => {
  console.log('start', event);
  await dev(event);
  console.log('finish');
};
