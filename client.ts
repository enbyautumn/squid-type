import Peer from 'peerjs';

let peer = new Peer();
let conn: Peer.DataConnection;
let position = Math.random() * 100;

peer.on('open', id => {
    console.log('My peer ID is: ' + id);
})

function connect() {
    let id = (document.getElementById('peerid') as HTMLInputElement).value;
    conn = peer.connect(id);

    conn.on('data', data => {
        if (data == "start") {
            setTimeout(() => {
                conn.send({"id": peer.id, "position": position});
            }, 3000)
        }

        if (data.id && data.id != peer.id) {
            console.log(data);
        }
    })

    conn.on('open', () => {
        // conn.send('hi!');
    });      
}

document.getElementById('connect')!.addEventListener('click', connect);

