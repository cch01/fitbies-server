import { PeerServer } from 'peer';

export default function (port: number): any {
  const peerServer = PeerServer({
    port,
    path: '/meetings',
    key: process.env.PEER_SERVER_KEY,
  });

  peerServer.on('connection', (client) => {
    console.log(`${client.getId()} has been connected.`);
  });

  peerServer.on('disconnect', (client) => {
    console.log(`${client.getId()} has been disconnected.`);
  });
}
