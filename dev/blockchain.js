const uuid = require('uuid')
const sha256 = require('sha256')
const currentNodeUrl = process.argv[3];

class Blockchain {
    constructor() {
        this.chain = [];
        this.pendingTransactions = [];

        this.currentNodeUrl = currentNodeUrl;
        this.networkNodes = [];

        this.createNewBlock(0, '0', '0');
    }
    //새로운 블록 붙이기
    createNewBlock(nonce, previousBlockHash, hash) {
        const newBlock = {
            //길이
            index: this.chain.length + 1,
            //시간
            timestamp: Date.now(),
            //정보
            transactions: this.pendingTransactions,
            //임의 숫자 ***
            nonce: nonce,
            //암호화 ***
            hash: hash,
            //이전 블록 해시값 ***
            previousBlockHash: previousBlockHash
        };
        this.pendingTransactions = [];
        this.chain.push(newBlock);
        return newBlock;
    }
    //마지막 블록 조회
    getLastBlock() {
        return this.chain[this.chain.length - 1];
    }
    //트랜잭션 추가
    createNewTransactions(amount, sender, recipient) {
        //사용자가 충분한 잔고가 있는지 조회 > amount가 balance 보다 많아야만 입력 가능
        // const addressTransactions = [];
        // this.chain.forEach(block => {
        // 	block.transactions.forEach(transaction => {
        // 		if(transaction.sender === address || transaction.recipient === address) {
        // 			addressTransactions.push(transaction);
        // 		};
        // 	});
        // });
        // let balance = 0;
        // addressTransactions.forEach(transaction => {
        // 	if (transaction.recipient === address) balance += transaction.amount;
        // 	else if (transaction.sender === address) balance -= transaction.amount;
        // });
        // if(balance >= amount){
        //     res.json({
        //         note: "Amount is more than Balance"
        //     })
        // }
        const newTransaction = {
            amount: amount,
            sender: sender,
            recipient: recipient,
            transactionId: uuid.v1().split('-').join(''),
        };
        return newTransaction;
    }
    //트랜잭션 메소즈 추가
    addTransactionToPenddingTransactions(transactionObj) {
        this.pendingTransactions.push(transactionObj);
        return this.getLastBlock()['index'] + 1;
    }
    //해시값 받기
    hashBlock(previousBlockHash, currentBlockData, nonce) {
        const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
        const hash = sha256(dataAsString);
        return hash;
    }
    //Pos 구현 > nonce 값 찾기 > 절대적 기준: 컴퓨팅 자원 > 컴파일 속도
    proofOfWork(previousBlockHash, currentBlockData) {
        let nonce = 0;
        let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
        while (hash.substring(0, 4) !== '0000') {
            nonce++;
            hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
        }
        return nonce;
    }
    //전체 블록을 순회하며 해시값이 맞는지 확인/ 최근 트랜잭션을 조작하려면 나머지 컴퓨팅 능력보다 강한 성능을 갖추면 가능
    chainIsValid(blockchain) {
        let validChain = true;

        //블록 각각 해시값 검증 및 해시 타당성 검증
        for (var i = 1; i < blockchain.length; i++) {

            const currentBlock = blockchain[i];
            const prevBlock = blockchain[i - 1];

            //기존 데이터 타당성 검증
            const blockHash = this.hashBlock(prevBlock['hash'], { transactions: currentBlock['transactions'], index: currentBlock['index'] }, currentBlock['nonce']);
            if (blockHash.substring(0, 4) !== '0000')
                validChain = false;

            //블록 해시값 검증 > 만약 데이터를 고치고 채굴했어도 다음 블록이 이전 블록 해시 참조
            if (currentBlock['previousBlockHash'] !== prevBlock['hash'])
                validChain = false;
        }

        //제네시스 블록 검증
        const genesisBlock = blockchain[0];
        const correctNonce = genesisBlock['nonce'] === 0;
        const correctHash = genesisBlock['hash'] === '0';
        const correctPreviousHash = genesisBlock['previousBlockHash'] === '0';
        const correctTransactions = genesisBlock['transactions'].length === 0;
        if (!correctNonce || !correctHash || !correctPreviousHash || !correctTransactions)
            validChain = false;

        return validChain;
    }
    //Block explorer Method
    getBlock(blockHash) {
        let correctBlock = null;
        this.chain.forEach(block => {
            if (block.hash === blockHash)
                correctBlock = block;
        });
        return correctBlock;
    }
    getTransaction(transactionId) {
        let correctTransaction = null;
        let correctBlock = null;
        this.chain.forEach(block => {
            block.transactions.forEach(transaction => {
                if (transaction.transactionId === transactionId) {
                    correctTransaction = transaction;
                    correctBlock = block;
                }
            });
        });
        return {
            correctTransaction,
            correctBlock
        };
    }
    getAddressData(address) {
        const addressTransactions = [];
        this.chain.forEach(block => {
            block.transactions.forEach(transaction => {
                if (transaction.sender === address || transaction.recipient === address) {
                    addressTransactions.push(transaction);
                };
            });
        });

        let balance = 0;
        addressTransactions.forEach(transaction => {
            if (transaction.recipient === address)
                balance += transaction.amount;
            else if (transaction.sender === address)
                balance -= transaction.amount;
        });

        return {
            addressTransactions: addressTransactions,
            addressBalance: balance
        };
    }
}













module.exports = Blockchain;