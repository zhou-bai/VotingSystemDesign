async function decryptResults() {
    // 获取所有候选人数据
    const candidates = await contract.getCandidates();
    
    // 管理员输入私钥
    const sk = bigInt(prompt("输入管理员私钥:"));
    
    candidates.forEach(async (c, index) => {
      let total = bigInt(0);
      
      for(let i=0; i<c.c1.length; i++) {
        const c1 = bigInt(c.c1[i]);
        const c2 = bigInt(c.c2[i]);
        
        // m = c2*(c1^sk)^{-1} mod p
        const numerator = c2;
        const denominator = c1.modPow(sk, p);
        const m = numerator.multiply(denominator.modInv(p)).mod(p);
        
        // 记录每个候选人的得票
        if(m.eq(g.modPow(1, p))) total = total.add(1);
      }
      
      console.log(`${c.name} 得票数: ${total}`);
    });
  }
  