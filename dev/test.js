const Blockchain = require('./blockchain')

const bitcoin = new Blockchain();

const bc1 = {
    "chain": [
        {
            "index": 1,
            "timestamp": 1634098244319,
            "transactions": [],
            "nonce": 0,
            "hash": "0",
            "previousBlockHash": "0"
        },
        {
            "index": 2,
            "timestamp": 1634098300928,
            "transactions": [],
            "nonce": 18140,
            "hash": "0000b9135b054d1131392c9eb9d03b0111d4b516824a03c35639e12858912100",
            "previousBlockHash": "0"
        },
        {
            "index": 3,
            "timestamp": 1634098302142,
            "transactions": [
                {
                    "amount": "00",
                    "sender": 12.5,
                    "recipient": "894fe6f02bdb11ecb416d38680927b78",
                    "tranactionId": "ab111b602bdb11ecb416d38680927b78"
                }
            ],
            "nonce": 73938,
            "hash": "0000da13987065c198650ee4bdc7c0dd8e553ab40dd0547d46e90c8fe1c11a74",
            "previousBlockHash": "0000b9135b054d1131392c9eb9d03b0111d4b516824a03c35639e12858912100"
        },
        {
            "index": 4,
            "timestamp": 1634098302964,
            "transactions": [
                {
                    "amount": "00",
                    "sender": 12.5,
                    "recipient": "894fe6f02bdb11ecb416d38680927b78",
                    "tranactionId": "abc74c002bdb11ecb416d38680927b78"
                }
            ],
            "nonce": 35445,
            "hash": "000059f3c0489236cf0f20330acb3057c6727914341647dc7cd8878d58ea6712",
            "previousBlockHash": "0000da13987065c198650ee4bdc7c0dd8e553ab40dd0547d46e90c8fe1c11a74"
        },
        {
            "index": 5,
            "timestamp": 1634098304346,
            "transactions": [
                {
                    "amount": "00",
                    "sender": 12.5,
                    "recipient": "894fe6f02bdb11ecb416d38680927b78",
                    "tranactionId": "ac44b9602bdb11ecb416d38680927b78"
                }
            ],
            "nonce": 111324,
            "hash": "0000f55f83112e7f432b32e5c3bf7dbfc953d936b5ac330300231248acab2750",
            "previousBlockHash": "000059f3c0489236cf0f20330acb3057c6727914341647dc7cd8878d58ea6712"
        },
        {
            "index": 6,
            "timestamp": 1634098330913,
            "transactions": [
                {
                    "amount": "00",
                    "sender": 12.5,
                    "recipient": "894fe6f02bdb11ecb416d38680927b78",
                    "tranactionId": "ad1799c02bdb11ecb416d38680927b78"
                }
            ],
            "nonce": 5099,
            "hash": "0000ca6857b3a858130baba8283f2f2fe3c4e0742564da35c1fc51bbdda05d76",
            "previousBlockHash": "0000f55f83112e7f432b32e5c3bf7dbfc953d936b5ac330300231248acab2750"
        }
    ],
    "pendingTransactions": [
        {
            "amount": "00",
            "sender": 12.5,
            "recipient": "894fe6f02bdb11ecb416d38680927b78",
            "tranactionId": "bcee03702bdb11ecb416d38680927b78"
        }
    ],
    "currentNodeUrl": "http://localhost:3002",
    "networkNodes": [
        "http://localhost:3001",
        "http://localhost:3003",
        "http://localhost:3004",
        "http://localhost:3005"
    ]
}
// const currentBlockData = [
//     {
//         amount: 100,
//         sender: "homg",
//         recipient: "jong123"
//     },
//     {
//         amount: 300,
//         sender: "asdf123",
//         recipient: "jong123"
//     },
//     {
//         amount: 600,
//         sender: "aas112",
//         recipient: "jong123"
//     },
// ]

// console.log(bitcoin.hashBlock(previousBlockHash, currentBlockData, 69356));

console.log("valid:", bitcoin.chainIsValid(bc1.chain));