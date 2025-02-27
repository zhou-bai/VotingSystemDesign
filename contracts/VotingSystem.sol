pragma solidity ^0.8.24;

contract VotingSystem {
    address public admin;
    uint256 public p; // 大素数
    uint256 public g; // 生成元
    uint256 public pk; // 公钥

    struct Candidate {
        string name;
        uint256[] c1; // ElGamal密文第一部分
        uint256[] c2; // ElGamal密文第二部分
    }

    Candidate[] public candidates;
    mapping(address => bool) public voters;
    mapping(address => bool) public hasVoted;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not authorized");
        _;
    }

    event VoterRegistered(address indexed voter);
    event VoteCasted(address indexed voter);

    constructor(uint256 _p, uint256 _g, uint256 _pk) {
        admin = msg.sender;
        p = _p;
        g = _g;
        pk = _pk;
    }

    function addCandidate(string memory _name) external onlyAdmin {
        candidates.push(
            Candidate({name: _name, c1: new uint256[](0), c2: new uint256[](0)})
        );
    }

    function registerVoter(address _voter) external onlyAdmin {
        require(!voters[_voter], "Already registered");
        voters[_voter] = true;
        emit VoterRegistered(_voter);
    }

    function vote(uint256[] calldata _c1, uint256[] calldata _c2) external {
        require(voters[msg.sender], "Not registered");
        require(!hasVoted[msg.sender], "Already voted");
        require(_c1.length == candidates.length, "Invalid cipher length");

        for (uint i = 0; i < candidates.length; i++) {
            candidates[i].c1.push(_c1[i]);
            candidates[i].c2.push(_c2[i]);
        }

        hasVoted[msg.sender] = true;
        emit VoteCasted(msg.sender);
    }

    function getCandidateCount() external view returns (uint256) {
        return candidates.length;
    }
}
