const dns = require('dns');

dns.resolveSrv('_mongodb._tcp.mine.liukkjw.mongodb.net', (err, addresses) => {
  if (err) {
    console.error('DNS SRV Resolution Failed:', err.message);
  } else {
    console.log('DNS SRV Resolution Success:', addresses);
  }
});
