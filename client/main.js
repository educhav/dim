// Generate a RSA key pair
async function generateKeyPair() {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 4096,
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
    );
    const publicKey = await window.crypto.subtle.exportKey(
        "spki",
        keyPair.publicKey
    );
    const privateKey = await window.crypto.subtle.exportKey(
        "pkcs8",
        keyPair.privateKey
    );
    return {
        publicKey: publicKey,
        privateKey: privateKey,
    };
}

async function encryptMessage(message, publicKey) {
    const encodedMessage = new TextEncoder().encode(message);
    const encryptedMessage = await window.crypto.subtle.encrypt(
        {
            name: "RSA-OAEP",
        },
        publicKey,
        encodedMessage
    );
    return encryptedMessage;
}

async function decryptMessage(encryptedMessage, privateKey) {
    const decryptedMessage = await window.crypto.subtle.decrypt(
        {
            name: "RSA-OAEP",
        },
        privateKey,
        encryptedMessage
    );
    const decodedMessage = new TextDecoder().decode(decryptedMessage);
    return decodedMessage;
}



const abi =
    [
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "recipient",
                    "type": "address"
                }
            ],
            "name": "getPubKey",
            "outputs": [
                {
                    "internalType": "bytes",
                    "name": "pubKey",
                    "type": "bytes"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "string",
                    "name": "displayName",
                    "type": "string"
                },
                {
                    "internalType": "bytes",
                    "name": "pubKey",
                    "type": "bytes"
                }
            ],
            "name": "registerUser",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "retrieveMessages",
            "outputs": [
                {
                    "components": [
                        {
                            "internalType": "address",
                            "name": "from",
                            "type": "address"
                        },
                        {
                            "internalType": "string",
                            "name": "content",
                            "type": "string"
                        },
                        {
                            "internalType": "uint256",
                            "name": "timestamp",
                            "type": "uint256"
                        }
                    ],
                    "internalType": "struct Storage.Message[]",
                    "name": "",
                    "type": "tuple[]"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "retrieveSenders",
            "outputs": [
                {
                    "components": [
                        {
                            "internalType": "string",
                            "name": "displayName",
                            "type": "string"
                        },
                        {
                            "internalType": "bytes",
                            "name": "pubKey",
                            "type": "bytes"
                        },
                        {
                            "internalType": "string",
                            "name": "avatar",
                            "type": "string"
                        },
                        {
                            "internalType": "address",
                            "name": "wallet",
                            "type": "address"
                        }
                    ],
                    "internalType": "struct Storage.User[]",
                    "name": "",
                    "type": "tuple[]"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "recipient",
                    "type": "address"
                },
                {
                    "internalType": "string",
                    "name": "content",
                    "type": "string"
                },
                {
                    "internalType": "uint256",
                    "name": "timestamp",
                    "type": "uint256"
                }
            ],
            "name": "sendMessage",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "string",
                    "name": "cid",
                    "type": "string"
                }
            ],
            "name": "updateAvatar",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "userExists",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "exists",
                    "type": "bool"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ]

const providerUrl = 'https://ropsten.infura.io/v3/ecdf734d233248a4af495ef2b789eda7';
const web3 = new Web3(providerUrl);
let textBox = document.getElementById("text-input");
let usersDropdown = document.getElementById("user-dropdown");
let contract;

let cache = {};

let selectedUser;

async function getSC() {
    const response = await fetch("https://localhost/3000/sc");
    const sc = (await response.json())['env'];
    contract = new web3.eth.Contract(abi, sc);
}

getSC();


textBox.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        let pubKey;
        if (cache[selectedUser]) {
            pubKey = cache[selectedUser];
            let encryptedMessage = encryptMessage(textBox.value, pubKey);
            contract.methods.sendMessage(selectedUser, encryptedMessage, Date.now()).call();
        }
        else {
            contract.methods.getPubKey(selectedUser).call((err, result) => {
                if (err) {
                    console.log(err);
                }
                else {
                    pubKey = result;
                    let encryptedMessage = encryptMessage(textBox.value, pubKey);
                    contract.methods.sendMessage(selectedUser, encryptedMessage, Date.now()).call();
                }
            });

        }
    }
});

let avatarUpload = document.getElementById('avatar-upload');
avatarUpload.onchange = function (event) {
    uploadAvatar(event.target.files[0]);
};

const messages = [];
const users = [];

function loadMessages() {
    let chatbox = document.getElementById('chatbox');
    for (let message of messages) {
        let msgElem = document.createElement("div");
        let displayElem = document.createElement("div");
        let timeElem = document.createElement("span");
        msgElem.className = 'message';
        msgElem.innerHTML = decryptMessage(message['content'], localStorage.getItem('privKey'));
        timeElem.innerHTML = new Date(message['timestamp'] * 1000);
        displayElem.innerHTML = message['displayName'];
        chatbox.appendChild(displayElem);
        chatbox.appendChild(msgElem);
        chatbox.appendChild(timeElem);
    }
}

function loadUsers() {
    let self = users[0];
    for (let i = 1; i < users.length; i++) {
        let userElem = document.createElement("a");
        userElem.innerHTML = users[i].displayName;
        userElem.addEventListener("click", () => {
            selectedUser = userElem.innerHTML;
        });
        usersDropdown.appendChild(userElem);
    }
}

function addRegistrationForm() {
    let registerContainer = document.getElementById("register-container");
    let registerHeader = document.createElement("h1");
    registerHeader.innerHTML = "Register an Account!";
    let registerInput = document.createElement("input");
    registerInput.type = 'text';

    registerInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            contract.methods.registerUser(registerInput.value, localStorage.getItem('pubKey')).call((err, result) => {
                if (!err) {
                    generateKeyPair().then((keys) => {
                        localStorage.setItem('privKey', keys.privateKey);
                    });
                }
            });
        }
    });
    registerContainer.appendChild(registerHeader);
    registerContainer.appendChild(registerInput);
}

async function uploadAvatar(file) {
    const formData = new FormData();
    formData.append('file', file);

    fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => contract.methods.uploadAvatar(data['hash']).call((err, result) => {
            if (err) {
                console.log(err);
            }
        }));
}

contract.methods.userExists().call((err, result) => {
    if (err) {
        console.error(err);
    } else {
        if (result) {
            contract.methods.retrieveMessages().call((err, result) => {
                if (err) {
                    console.log(err);
                }
                else {
                    messages = result;
                }
            });
            contract.methods.retrieveSenders().call((err, result) => {
                if (err) {
                    console.log(err);
                }
                else {
                    users = result;
                }
            });
            loadMessages();
            loadUsers();
        }
        else {
            addRegistrationForm();
        }
    }
});

if (typeof ethereum !== 'undefined') {
    console.log('Metamask is installed!');
    ethereum.request({ method: 'eth_requestAccounts' })
        .then((accounts) => {
            const walletAddress = accounts[0];
        })
        .catch((error) => {
            console.error(error);
        });
} else {
    console.log('Metamask is not installed!');
}