import Peer from 'peerjs';

let peer = new Peer();
let conn: Peer.DataConnection;

peer.on('open', id => {
    console.log('My peer ID is: ' + id);
})

function connect() {
    let id = (document.getElementById('peerid') as HTMLInputElement).value;
    conn = peer.connect(id);

    conn.on('data', data => {
        console.log(data);
    })

    conn.on('open', () => {
        conn.send('hi!');
    });      
}

document.getElementById('send')!.addEventListener('click', () => {
    conn.send('Hello!');
});

document.getElementById('connect')!.addEventListener('click', connect);

