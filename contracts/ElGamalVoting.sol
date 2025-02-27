// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ElGamalVoting {
    address public admin;

    // 系统参数
    uint256 public p;
    uint256 public g;
    uint256 public pk;

    struct Candidate {
        uint256 sumC1;
        uint256 sumC2;
        string name;
    }

    Candidate[] public candidates;
    mapping(address => bool) public voters;

    event VoteRecorded(address indexed voter);
    event CandidateAdded(uint256 indexed index);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Admin only");
        _;
    }

    constructor(uint256 _p, uint256 _g, uint256 _pk) {
        admin = msg.sender;
        p = _p;
        g = _g;
        pk = _pk;
    }

    function addCandidate(string memory _name) external onlyAdmin {
        candidates.push(Candidate({sumC1: 1, sumC2: 1, name: _name}));
        emit CandidateAdded(candidates.length - 1);
    }

    function vote(
        uint256[] calldata c1List,
        uint256[] calldata c2List
    ) external {
        require(c1List.length == candidates.length, "Invalid c1 length");
        require(c2List.length == candidates.length, "Invalid c2 length");
        require(!voters[msg.sender], "Already voted");

        for (uint256 i = 0; i < candidates.length; i++) {
            // 使用 mulmod 进行安全模乘法
            candidates[i].sumC1 = mulmod(candidates[i].sumC1, c1List[i], p);
            candidates[i].sumC2 = mulmod(candidates[i].sumC2, c2List[i], p);
        }

        voters[msg.sender] = true;
        emit VoteRecorded(msg.sender);
    }

    function getCandidate(
        uint256 index
    ) external view returns (uint256, uint256, string memory) {
        require(index < candidates.length, "Invalid index");
        Candidate memory c = candidates[index];
        return (c.sumC1, c.sumC2, c.name);
    }

    function candidateCount() external view returns (uint256) {
        return candidates.length;
    }
}
