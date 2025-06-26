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
        // Add the private key of the account that deployed the contract
        "54d244cac4dc158d25688071453f13379629c7fba58f4976e05006c5d6121e8a"
      ]
    }
  },
};