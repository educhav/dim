pragma solidity >=0.8.2 <0.9.0;

contract Chat {

    struct User {
        
        string displayName;
        bytes pubKey;
        string avatar;
        address wallet;
    }
    struct Message {
        address from;
        string content;
        uint256 timestamp;
    }
    mapping(address => User) private users;
    mapping(address => Message[]) private messages;
    mapping(address => mapping(address => bool)) private sendersMap;
    mapping(address => User[]) private senders;
   
    function userExists() public view returns (bool exists) {
        return bytes(users[msg.sender].displayName).length == 0;
    }
    function registerUser(string memory displayName, bytes memory pubKey) public {
        require(pubKey.length != 0);
        require(bytes(users[msg.sender].displayName).length == 0);

        User memory user = User(displayName, pubKey, '', msg.sender);
        users[msg.sender] = user;
        senders[msg.sender].push(user);
    }

    function getPubKey(address recipient) public view returns (bytes memory pubKey) {
        require(users[recipient].pubKey.length != 0);
        return users[recipient].pubKey;
    }

    function sendMessage(address recipient, string memory content, uint256 timestamp) public {
        require(users[recipient].pubKey.length != 0);
        Message memory message = Message(msg.sender, content, timestamp);
        messages[recipient].push(message);
        if (!sendersMap[recipient][msg.sender]) {
            sendersMap[recipient][msg.sender] = true;
            senders[recipient].push(users[msg.sender]);
        }
    }

    function updateAvatar(string memory cid) public {
        users[msg.sender].avatar = cid;
    }

    function retrieveMessages() public view returns (Message[] memory) {
        return messages[msg.sender];
    }
    function retrieveSenders() public view returns (User[] memory) {
        return senders[msg.sender];
    }

}