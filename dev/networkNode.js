const express = require('express')
const app = express();
const axios = require('axios');
const Blockchain = require('./blockchain')
const uuid = require('uuid')
const port = process.argv[2];
const rp = require('request-promise');

const nodeAddress = uuid.v1().split('-').join('');

const bitcoin = new Blockchain();

// json post 파싱
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// api 구축
app.get('/blockchain', function (req, res) {
    res.send(bitcoin)
});

// 정보 트랜잭션에 기록
app.post('/transaction', function (req, res) {
    const newTransaction = req.body;
    const blockIndex = bitcoin.addTransactionToPenddingTransactions(newTransaction);
    // res.send(`amount is ${req.body.amount} coin`)
    res.json({ note: `transaction will be added in block ${blockIndex}`})
});

//새로운 트랜잭션을 모든 노드에 배포 후 > pending에 등록
app.post('/transaction/broadcast', (req, res) => {
    const newTransaction = bitcoin.createNewTransactions(req.body.amount, req.body.sender, req.body.recipient);
    
    //내 펜딩 리스트에 추가
    bitcoin.addTransactionToPenddingTransactions(newTransaction);
    
    //트랜잭션 추가 리스트에 대기
    const requestPromises = [];
    bitcoin.networkNodes.forEach(networkUrl => {
        const requestOptions = {
            uri: networkUrl + '/transaction',
            method: 'POST',
            body: newTransaction,
            json: true
        }
        requestPromises.push(rp(requestOptions))
    });

    //트랜잭션 추가 실행
    Promise.all(requestPromises)
    .then(data => {
        res.json({
            note: "Transaction created and broadcast successfully."
        })
    })
})

//채굴
app.get('/mine', function (req, res) {

    //이전 블록 해시값 호출
    const lastBlock = bitcoin.getLastBlock();
    const previousBlockHash = lastBlock['hash'];
    
    //트랜잭션이 계속 업뎃되는대 이거 어떻게 새로고침 함?
    const currentBlockData = {
        transactions: bitcoin.pendingTransactions,
        index: lastBlock['index'] + 1
    }

    //nonce 값 구하기 > 오래 걸림
    const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
    
    
    //새로운 해시값 구하기
    const newHash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce);
    
    //새로운 블록 생성
    const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, newHash);

    //모든 노드에 새로운 블록을 전달
    const requestPromises = []
    bitcoin.networkNodes.forEach(newNodeUrl => {
        const requestOptions = {
            uri: newNodeUrl + '/receive-new-block',
            method: 'POST',
            body: { newBlock : newBlock },
            json: true
        }
        requestPromises.push(rp(requestOptions))
    });

    Promise.all(requestPromises)
    .then(data => {
        const requestOptions = {
            uri: bitcoin.currentNodeUrl + '/transaction/broadcast',
            method: 'POST',
            json: true,
            body:{
                amount: 12.5,
                sender: "00",
                recipient: nodeAddress
            }
        }
        return rp(requestOptions)
    });

    res.json({
        note: "block mined & broadcast successfully",
        block: newBlock
    });

});
 

//--------------- 새로운 블록 전달------------
app.post('/receive-new-block', (req, res) => {
    const newBlock = req.body.newBlock;
    const lastBlock = bitcoin.getLastBlock();

    //이 두가지 만으로 블록을 검증할 수 있을까?
    const correctHash = lastBlock.hash === newBlock.previousBlockHash;
    const correctIndex = lastBlock['index'] + 1 === newBlock['index'];

    if(correctHash && correctIndex){
        bitcoin.chain.push(newBlock);
        bitcoin.pendingTransactions = [];
        res.json({
            note: "new Block received and accepted",
            newBlock: newBlock
        })
    }else{
        res.json({
            note: "new Block rejected",
            newBlock: newBlock
        })
    }
    
})



//---------------탈중앙화 네트워크------------

//1) 새로운 노드를 추가하고 전체 노드에 전달
app.post('/register-and-broadcast-node', function(req, res){
    const newNodeUrl = req.body.newNodeUrl;

    //만약 등록되어 있지 않다면 새로운 노드를 네트워크에 추가합니다.
    const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) == -1;
    const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;

    if(nodeNotAlreadyPresent && notCurrentNode) 
    bitcoin.networkNodes.push(newNodeUrl);

    //모든 네트워크는 새로운 노드를 업데이트 하기위한 클로져를 배열에 추가
    const regNodesPromises = [];
    bitcoin.networkNodes.forEach(networkUrl => {
        const requestOptions = {
            uri: networkUrl + '/register-node',
            method: 'POST',
            body: { newNodeUrl: newNodeUrl},
            json: true
        };
        regNodesPromises.push(rp(requestOptions));
    });

  
    //새로운 노드는 기존 노드 정보를 업데이트 합니다.
        Promise.all(regNodesPromises)
        .then( data => {
            const bulkRegisterOptions = {
                uri: newNodeUrl + '/register-nodes-bulk',
                method: 'POST',
                body: { allNetworkNodes : [...bitcoin.networkNodes, bitcoin.currentNodeUrl]},
                json: true
            };

            //이거 axios로 바꿀 수 있나요?
            return rp(bulkRegisterOptions)
        })
        .then(data => {
            res.json({note: 'New Node registered with network successfullyyyyy'});
        })
})

//2) 새로운 노드 등록
app.post('/register-node', (req, res) =>{
    const newNodeUrl = req.body.newNodeUrl;
    
    //리스트에 주인은 추가되지 않습니다.
    const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) == -1;
    //손님이 직접 추가할 순 없습니다.
    const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;

    if(nodeNotAlreadyPresent && notCurrentNode)
    bitcoin.networkNodes.push(newNodeUrl);
    res.json({note: 'New node registered successfully.'});
})

//3) 손님에게 다른 손님 리스트 전달
app.post('/register-nodes-bulk', (req, res) => {
    const allNetworkNodes = req.body.allNetworkNodes;
    allNetworkNodes.forEach(networkNodeUrl => {

        //이미 손님이 등록되어 있거나, 손님이 스스로를 등록하거나
        const notCurrentNode = bitcoin.currentNodeUrl !== networkNodeUrl
        const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(networkNodeUrl) == -1
        if(notCurrentNode && nodeNotAlreadyPresent){
            bitcoin.networkNodes.push(networkNodeUrl);
        }
    });
    res.json({
        note: 'bulk registration successful'
    })
});


//블록 콘센서스
app.get('/consensus', (req, res) => {
    const requestPromises = [];
    bitcoin.networkNodes.forEach(networkUrl => {
        const requestOptions = {
            uri: networkUrl  + '/blockchain',
            method: 'GET',
            json: true
        };
        requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises)
    .then(blockchains => {
        //내 체인의 길이
        const currentChainLength = bitcoin.chain.length;
        
        let maxChainLength = currentChainLength;
        //새로운 체인 변수
        let newLongestChain = null;
        let newPendingTransactions = null;
        
        //내 체인을 모든 체인과 비교
        blockchains.forEach(blockchain => {
            if(blockchain.chain.length > maxChainLength){
                maxChainLength = blockchain.chain.length;
                newLongestChain = blockchain.chain;
                newPendingTransactions = blockchain.pendingTransactions;
            }
        });

        //내 체인이 가장 길거나, 긴 체인이 타당하지 않으면 교체 안함
        if(!newLongestChain || (newLongestChain && !bitcoin.chainIsValid(newLongestChain))){
            res.json({
                note: "Current chain has not been replaced",
                chain: bitcoin.chain
            })
        }else{
            bitcoin.chain = newLongestChain;
            bitcoin.pendingTransactions = newPendingTransactions;
            res.json({
                note: "This chain has been replaced",
                chain: bitcoin.chain
            })
        }
    })
});


//--------------------블록 탐색기-----------------

//url에 요청하면 서버가 반환
app.get('/block/:blockHash', (req, res) => {
    // :blockHash은 req.params에서 조회 가능
    const blockHash = req.params.blockHash;
    const correctBlock = bitcoin.getBlock(blockHash);
    res.json({
        block: correctBlock
    })
});

app.get('/transaction/:transactionId', (req, res) => {
    const transactionId = req.params.transactionId;
    const transactionData = bitcoin.getTransaction(transactionId);
    res.json({
        transaction: transactionData.correctTransaction,
        block: transactionData.correctBlock,
    })
});

app.get('/address/:address', function(req, res) {
	const address = req.params.address;
	const addressData = bitcoin.getAddressData(address);
	res.json({
		addressData: addressData
	});
});



// --------------모르겠어요  block explorer
app.get('/block-explorer', function(req, res) {
	res.sendFile('./block-explorer/index.html', { root: __dirname });
});

app.listen(port, () => console.log(`listening on port ${port}...`))