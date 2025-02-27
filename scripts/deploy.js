const { ethers } = require("hardhat");
const bigInt = require("big-integer");

async function main() {
  // 示例参数 - 实际应使用安全素数
  const p = bigInt(23); 
  const g = bigInt(5);
  const sk = bigInt(6); // 管理员私钥（切勿公开）
  const pk = g.modPow(sk, p); // 公钥 = 5^6 mod 23 = 8

  console.log("部署参数:");
  console.log(`p=${p}, g=${g}, pk=${pk}`);

  const VotingSystem = await ethers.getContractFactory("VotingSystem");
  const voting = await VotingSystem.deploy(p, g, pk);
  
  console.log("合约地址:", voting.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
