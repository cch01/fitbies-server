import { ExpressPeerServer } from 'peer';

export default function (server, options = {}): any {
  const peerServer = ExpressPeerServer(server, options);

  peerServer.on('connection', (client) => {
    console.log(`${client} has been connected.`);
  });

  peerServer.on('disconnect', (client) => {
    console.log(`${client} has been disconnected.`);
  });

  return peerServer;
}
