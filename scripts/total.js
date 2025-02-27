const bigInt = require('big-integer');

// ================= 系统参数 =================
let p, g; // 公共参数

// ================= 密钥生成阶段 =================
function keyGen(k) {
    // 生成大素数（简化实现，实际需用安全方法）
    p = bigInt(7919); // 演示用较小素数
    // 选择生成器(此处固定简化，实际需要验证g的阶)
    g = bigInt(2);
    
    const x = bigInt.randBetween(2, p.minus(1)); // 随机私钥
    const pk = g.modPow(x, p); // 公钥
    return { pk, sk: x };
}

// ================== 加密协议实现 ==================
class VotingSystem {
    constructor(p, g, pk) {
        this.p = p;
        this.g = g;
        this.pk = pk;
    }

    // 对单个候选人的投票加密（m: 0/1）
    encryptVote(m) {
        const r = bigInt.randBetween(1, this.p.minus(1));
        const c1 = this.g.modPow(r, this.p);
        const c2 = this.g.modPow(m, this.p)
            .multiply(this.pk.modPow(r, this.p))
            .mod(this.p);
        return { c1, c2 };
    }

    // 合并所有投票后解密（sum_c1, sum_c2为累加结果）
    decryptResult(sum_c1, sum_c2, sk) {
        const denominator = sum_c1.modPow(sk, this.p);
        const numerator = sum_c2;
        
        // 使用费马小定理计算模逆元：1/denominator ≡ denominator^(p-2) mod p
        const inverse = denominator.modPow(this.p.minus(2), this.p);
        const gSum = numerator.multiply(inverse).mod(this.p);
        
        // 求解离散对数（演示环境直接暴力计算）
        return this.solveDiscreteLog(gSum);
    }

    solveDiscreteLog(target) {
        let accum = bigInt(1);
        for (let i = 0; i < 1000; i++) { // 1000票数上限
            if (accum.eq(target)) return i;
            accum = accum.multiply(g).mod(p);
        }
        throw new Error('Logarithm not found');
    }
}

// ===================== 测试代码 =====================
function testElection() {
    console.log('【生成密钥】');
    const { pk, sk } = keyGen(1024);
    console.log('管理员公钥:', pk.toString());
    console.log('管理员私钥:', sk.toString());

    const vs = new VotingSystem(p, g, pk);
    const candidates = 3;
    const votesPerVoter = Array(4).fill(1); // 4个投票者都投候选人1

    // 初始化每个候选人的累计密文
    const encryptedVotes = Array(candidates).fill().map(() => ({ 
        c1: bigInt(1), 
        c2: bigInt(1) 
    }));

    // 模拟加密投票过程
    votesPerVoter.forEach((candidateIndex) => {
        for (let j = 0; j < candidates; j++) {
            const m = (j === candidateIndex - 1) ? 1 : 0;
            const { c1, c2 } = vs.encryptVote(m);
            
            // 累加密文（相乘）
            encryptedVotes[j].c1 = encryptedVotes[j].c1.multiply(c1).mod(p);
            encryptedVotes[j].c2 = encryptedVotes[j].c2.multiply(c2).mod(p);
        }
    });

    // 计票阶段
    const results = encryptedVotes.map((vote, index) => {
        const total = vs.decryptResult(vote.c1, vote.c2, sk);
        return `候选人 ${index + 1} 得票: ${total}`;
    });

    console.log('\n【投票结果】');
    results.forEach(r => console.log(r));
}

// 运行测试
testElection();
