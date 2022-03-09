import Peer from 'peerjs';

let peer = new Peer();
let delay = 5000;
let connections: Peer.DataConnection[] = [];
let connectionDisplay = document.getElementById('connections') as HTMLUListElement;

peer.on('open', id => {
    console.log('My peer ID is: ' + id);
    document.getElementById('peerid')!.innerText = id;
})

peer.on('connection', conn => {
    connections.push(conn);

    let li = document.createElement("li");
    li.innerText = conn.peer;
    connectionDisplay.appendChild(li);

    conn.on('data', data => {
        console.log(data);
        connections.forEach(c => c.send(data));
    })

    conn.on('open', () => {
        connections.forEach(c => c.send('hi!'));
    });     
})

function start() {
    connections.forEach(c => {
        c.send("start");
    });
    setTimeout(() => {
        connections.forEach(c => {
            c.send("stop");
        });
    }, delay);
}

document.getElementById('start')!.addEventListener('click', start);