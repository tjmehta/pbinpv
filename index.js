var cluster = require('cluster');
var pluck = require('101/pluck');
var workers = [];

if (cluster.isMaster) {
  // Count the machine's CPUs
  attachLogs(cluster);
  var cpuCount = require('os').cpus().length;
  // Create a worker for each CPU
  for (var i = 0; i < cpuCount; i += 1) {
    createWorker();
  }
} else {
  // START
  var port = process.env.PORT || 3000;
  var app = require('./app');
  app.listen(port, function (err) {
    if (err) { throw err; }
    console.log('Server listening on port '+port);
  });
}

function createWorker () {
  var worker = cluster.fork();
  workers.push(worker);
  console.log(new Date(), 'CLUSTER: create new worker', worker.id);
  return worker;
}
function attachLogs (clusters) {
  clusters.on('fork', function(worker) {
    console.log(new Date(), 'CLUSTER: fork worker', worker.id);
  });
  clusters.on('listening', function(worker, address) {
    console.log(new Date(), 'CLUSTER: listening worker', worker.id,
      'address', address.address + ":" + address.port);
  });
  clusters.on('exit', function(worker, code, signal) {
    console.log(new Date(), 'CLUSTER: exit worker', worker.id, 'code', code, 'signal', signal);
    workers.map(pluck('id')).some(function (workerId, i) {
      if (workerId === worker.id) {
        workers.splice(i, 1); // remove worker from workers
      }
    });
    createWorker();
  });
  clusters.on('online', function(worker) {
    console.log(new Date(), 'CLUSTER: online worker', worker.id);
  });
  clusters.on('disconnect', function(worker) {
    console.log(new Date(), 'CLUSTER: disconnected worker', worker.id, "killing now");
    worker.kill();
  });
}