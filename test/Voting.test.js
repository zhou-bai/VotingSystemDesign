const { expect } = require("chai");
const { ethers } = require("hardhat");
const bigInt = require("big-integer");

describe("ElGamal Voting System", function () {
  let contract;     // 待测试的智能合约实例
  let admin, voter1; // 测试账户
  const p = bigInt(7919); // 公共参数：素数模数
  const g = bigInt(2);   // 公共参数：生成器
  let pk, sk;        // 密钥对（pk: 公钥，sk: 私钥）

    /* 全局前置配置，在所有测试用例前执行一次 */
  before(async () => {
    // 生成测试密钥对（非生产环境方法）
    const x = bigInt(123); // 预先生成的测试私钥
    pk = g.modPow(x, p);  // 计算对应公钥 g^x mod p
    sk = x;

    // 获取Hardhat提供的测试账户（默认第一个为部署者账户）
    [admin, voter1, voter2, voter3, voter4] = await ethers.getSigners(); 
  });

    /* 每个测试用例的前置配置 */
  beforeEach(async () => {
        // 编译并部署新合约实例（每次测试前重置状态）
    const Contract = await ethers.getContractFactory("ElGamalVoting");
    contract = await Contract.deploy(p.toString(), g.toString(), pk.toString());//传递p g pk
    await contract.waitForDeployment();
  });

  // 测试密钥生成一致性
  describe("系统参数", () => {
    it("正确初始化参数", async () => {
      // 验证合约记录的参数与实际部署参数一致      
      expect(await contract.p()).to.equal(p.toString());
      expect(await contract.g()).to.equal(g.toString());
      expect(await contract.pk()).to.equal(pk.toString());
    });
  });

  // 测试候选人和投票逻辑
  describe("投票流程", () => {
    /* 每个投票测试的前置配置 */    
    beforeEach(async () => {
      // 添加两名候选人（需要管理员权限）
      await contract.connect(admin).addCandidate("Alice");
      await contract.connect(admin).addCandidate("Bob");
    });

    it("处理三人投票后添加第四人投第二个候选人", async () => {
      const vs = new VotingSystem(p, g, pk);
    
      // 第一组选民投候选人0（原逻辑）
      let targetCandidate = 0;
      const firstGroupVoters = [voter1, voter2, voter3]; 
      
      // ==== 原三人投票循环 ====
      for (const voter of firstGroupVoters) { 
        const votes = [];
        for(let i = 0; i < 2; i++) {
          votes.push(i === targetCandidate ? 
            vs.encryptVote(1) : vs.encryptVote(0));
        }
        
        await contract.connect(voter).vote(
          votes.map(v => v.c1.toString()),
          votes.map(v => v.c2.toString())
        );
      }
    
      // ==== 独立投票操作（在循环外）=====
      console.log("\n独立处理第四个投票者...");
      targetCandidate = 1; // 指定投票给第二个候选人
      const votes = [];
      for(let i = 0; i < 2; i++) { // 遍历所有候选人
        votes.push(i === targetCandidate ? 
          vs.encryptVote(1) : vs.encryptVote(0)
        );
      }
      await contract.connect(voter4).vote(
        votes.map(v => v.c1.toString()),
        votes.map(v => v.c2.toString())
      );
    
      // ==== 验证结果 ====
      const candidateCount = await contract.candidateCount();
      console.log("\n【最终得票】");
      
      for (let i = 0; i < candidateCount; i++) {
        const [sumC1, sumC2, name] = await contract.getCandidate(i);
        const decrypted = vs.decryptResult(
          bigInt(sumC1),
          bigInt(sumC2),
          sk
        );
        
        console.log(`${name} -> ${decrypted}票`);
        
        // 断言更新（第一个候选人3票，第二个1票）    
        //if(i === 0) {
        //  expect(decrypted).to.equal(firstGroupVoters.length); 
        //} else if(i === 1) {
        //  expect(decrypted).to.equal(1); 
        //}
      }
    });  
  });

});

// JS测试辅助类
class VotingSystem {
  constructor(p, g, pk) {
    this.p = p;
    this.g = g;
    this.pk = pk;
  }

  encryptVote(m) {
    const r = bigInt.randBetween(1, this.p.minus(1));
    return {
      c1: this.g.modPow(r, this.p).toString(),
      c2: this.g.modPow(m, this.p)
        .multiply(this.pk.modPow(r, this.p))
        .mod(this.p)
        .toString()
    };
  }

  decryptResult(sumC1, sumC2, sk) {
    const denominator = sumC1.modPow(sk, this.p);
    const numerator = sumC2;
    
    const inverse = denominator.modInv(this.p);
    const gSum = numerator.multiply(inverse).mod(this.p);
    
    return this.solveDiscreteLog(gSum);
  }

  solveDiscreteLog(target) {
    let accum = bigInt(1);
    for (let i = 0; i < 1000; i++) {
      if (accum.eq(target)) return i;
      accum = accum.multiply(this.g).mod(this.p);
    }
    throw new Error('Logarithm not found');
  }
}
