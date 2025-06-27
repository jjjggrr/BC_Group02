// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MultiSigWallet is Ownable {
    event Deposit(address indexed sender, uint256 amount);
    event TransactionCreated(uint256 indexed transactionId, address indexed to, uint256 value, bytes data);
    event TransactionExecuted(uint256 indexed transactionId);
    event TransactionConfirmed(uint256 indexed transactionId, address indexed signer);
    event TransactionRevoked(uint256 indexed transactionId, address indexed signer);

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmations;
    }

    mapping(uint256 => Transaction) public transactions;
    mapping(uint256 => mapping(address => bool)) public isConfirmed;

    address[] public signers;
    mapping(address => bool) public isSigner;
    uint256 public requiredConfirmations;
    uint256 public transactionCount;

    modifier onlySigner() {
        require(isSigner[msg.sender], "Not a signer");
        _;
    }

    constructor(address[] memory _signers, uint256 _requiredConfirmations) Ownable(msg.sender) {
        require(_signers.length > 0, "Signers required");
        require(_requiredConfirmations > 0 && _requiredConfirmations <= _signers.length, "Invalid number of required confirmations");

        for (uint256 i = 0; i < _signers.length; i++) {
            address signer = _signers[i];
            require(signer != address(0), "Invalid signer");
            require(!isSigner[signer], "Duplicate signer");
            signers.push(signer);
            isSigner[signer] = true;
        }
        requiredConfirmations = _requiredConfirmations;
    }

    function deposit() external payable {
        emit Deposit(msg.sender, msg.value);
    }

        function createTransaction(address to, uint256 value, bytes memory data) external {
        // Allow either a signer or the owner of this wallet to create a transaction
        require(isSigner[msg.sender] || msg.sender == owner(), "Not authorized to create transaction");
        
        uint256 transactionId = transactionCount++;
        transactions[transactionId] = Transaction({
            to: to,
            value: value,
            data: data,
            executed: false,
            confirmations: 0
        });
        
        emit TransactionCreated(transactionId, to, value, data);
        
        // AUTO-CONFIRM: If the creator is a signer, automatically confirm
        if (isSigner[msg.sender]) {
            isConfirmed[transactionId][msg.sender] = true;
            transactions[transactionId].confirmations = 1;
            emit TransactionConfirmed(transactionId, msg.sender);
            
            // Execute immediately if we have enough confirmations
            if (transactions[transactionId].confirmations >= requiredConfirmations) {
                executeTransaction(transactionId);
            }
        }
    }

    function addSigner(address newSigner) external onlyOwner {
    require(newSigner != address(0), "Invalid signer");
    require(!isSigner[newSigner], "Already a signer");
    
    signers.push(newSigner);
    isSigner[newSigner] = true;
}

    function confirmTransaction(uint256 transactionId) external onlySigner {
        require(transactions[transactionId].to != address(0), "Transaction does not exist");
        require(!isConfirmed[transactionId][msg.sender], "Transaction already confirmed");

        isConfirmed[transactionId][msg.sender] = true;
        transactions[transactionId].confirmations++;
        emit TransactionConfirmed(transactionId, msg.sender);

        if (transactions[transactionId].confirmations >= requiredConfirmations) {
            executeTransaction(transactionId);
        }
    }

    function executeTransaction(uint256 transactionId) internal {
        require(transactions[transactionId].confirmations >= requiredConfirmations, "Not enough confirmations");
        require(!transactions[transactionId].executed, "Transaction already executed");

        Transaction storage txn = transactions[transactionId];
        txn.executed = true;

        (bool success, ) = txn.to.call{value: txn.value}(txn.data);
        require(success, "Transaction execution failed");

        emit TransactionExecuted(transactionId);
    }

    function revokeConfirmation(uint256 transactionId) external onlySigner {
        require(isConfirmed[transactionId][msg.sender], "Transaction not confirmed");

        isConfirmed[transactionId][msg.sender] = false;
        transactions[transactionId].confirmations--;
        emit TransactionRevoked(transactionId, msg.sender);
    }

    function getSigners() external view returns (address[] memory) {
        return signers;
    }

    function getTransaction(uint256 transactionId) external view returns (Transaction memory) {
        return transactions[transactionId];
    }
}