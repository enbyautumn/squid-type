import Peer from 'peerjs';

let peer = new Peer();
let connections: Peer.DataConnection[] = [];

peer.on('open', id => {
    console.log('My peer ID is: ' + id);
})

peer.on('connection', conn => {
    connections.push(conn);
    conn.on('data', data => {
        console.log(data);
        connections.forEach(c => c.send(data));
    })

    conn.on('open', () => {
        connections.forEach(c => c.send('hi!'));
    });      
})