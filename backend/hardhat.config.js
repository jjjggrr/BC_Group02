require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
    ]
  },
  networks: {
    hardhat: {
    },
    morpheus: {
    url: "https://instructoruas-28364.morpheuslabs.io",
    accounts: [
        "54d244cac4dc158d25688071453f13379629c7fba58f4976e05006c5d6121e8a", // Your main account
        "69e1e5552ac51f7f7bf732ce5d9d12fc5de72ae96dfcd85098b48fc881d86455", 
        "6232701f0549e96dba06e12f1ec5f49ea33a58f266b506fc7c3362c84461d337"
    ]
}
  },
};