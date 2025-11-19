const crypto = require('crypto');

const apiSecret = 'YSM6HMjJXlC1IPmIl87pc7QbX_Y'; // do NOT paste secret publicly
const timestamp = process.argv[2] || Math.floor(Date.now() / 1000);
const paramsToSign = `folder=savecode&timestamp=${timestamp}`;

const signature = crypto.createHash('sha1').update(paramsToSign + apiSecret).digest('hex');

console.log({ paramsToSign, timestamp, signature });
