const bankAutoConfirm = async () => {
    const [, bankAccount] = await hre.ethers.getSigners(); // Second signer is bank
    
    // Listen for TransactionCreated events on both MultiSigs
    const bankMultiSig = new ethers.Contract(bankMultiSigAddr, multiSigAbi, bankAccount);
    
    bankMultiSig.on("TransactionCreated", async (transactionId, to, value, data) => {
        console.log(`Bank: New transaction ${transactionId} created, auto-confirming...`);
        
        try {
            const confirmTx = await bankMultiSig.confirmTransaction(transactionId);
            await confirmTx.wait();
            console.log(`Bank: Transaction ${transactionId} confirmed and executed!`);
        } catch (error) {
            console.error(`Bank: Failed to confirm transaction ${transactionId}:`, error);
        }
    });
};