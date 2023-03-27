/*const web3 = require("web3");
const { ethers } = require("hardhat");
const BN = web3.utils.BN;

const hash = web3.utils.keccak256;
var assert = require("assert");
const { BigNumber } = require("ethers");

advanceTimeAndBlock = async (time) => {
  await advanceTime(time);
  await advanceBlock();
  console.log("Time Travelling...");
  return Promise.resolve(web3.eth.getBlock("latest"));
};

const takeFifteen = async () => {
  await advanceTime(60 * 18);
};

advanceTime = async (time) => {
  await network.provider.send("evm_increaseTime", [time]);
  await network.provider.send("evm_mine");
};
advanceBlock = () => {
  return new Promise((resolve, reject) => {
    web3.currentProvider.send(
      {
        jsonrpc: "2.0",
        method: "evm_mine",
        id: new Date().getTime(),
      },
      (err, result) => {
        if (err) {
          return reject(err);
        }
        const newBlockHash = web3.eth.getBlock("latest").hash;

        return resolve(newBlockHash);
      }
    );
  });
};

async function expectThrow(promise) {
  try {
    await promise;
  } catch (error) {
    const invalidOpcode = error.message.search("invalid opcode") >= 0;
    const outOfGas = error.message.search("out of gas") >= 0;
    const revert = error.message.search("revert") >= 0;
    assert(
      invalidOpcode || outOfGas || revert,
      "Expected throw, got '" + error + "' instead"
    );
    return;
  }
  assert.fail("Expected throw not received");
}

async function expectThrowMessage(promise) {
  try {
    await promise;
  } catch (error) {
    return error;
  }
}

function to18(n) {
  return ethers.BigNumber.from(n).mul(ethers.BigNumber.from(10).pow(18));
}

function tob32(n) {
  return ethers.utils.formatBytes32String(n);
}

function uintTob32(n) {
  let vars = web3.utils.toHex(n);
  vars = vars.slice(2);
  while (vars.length < 64) {
    vars = "0" + vars;
  }
  vars = "0x" + vars;
  return vars;
}

function bytes(n) {
  return web3.utils.toHex(n);
}

function getBlock() {
  return ethers.provider.getBlock();
}

function toWei(n) {
  return web3.utils.toWei(n);
}

function toTRB(n) {
  return BigNumber.from(Math.round((((n/1e9)*0.59)/11)*1e18));
}

module.exports = {
  stakeAmount: new BN(web3.utils.toWei("500", "ether")),
  timeTarget: 240,
  hash,
  zeroAddress: "0x0000000000000000000000000000000000000000",
  to18,
  uintTob32,
  tob32,
  bytes,
  getBlock,
  maxUint256: new BN(
    "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
  ),
  advanceTime,
  advanceBlock,
  advanceTimeAndBlock,
  toTRB,
  takeFifteen,
  toWei,
  expectThrow,
  expectThrowMessage,
};

//Globals
export const tellorAddressMainnet = '0x88dF592F8eb5D7Bd38bFeF7dEb0fBc02cf3778a0'
export const tellorAddressRinekby = '0x88dF592F8eb5D7Bd38bFeF7dEb0fBc02cf3778a0'
export const tellorAddressPolygon = '0xE3322702BEdaaEd36CdDAb233360B939775ae5f1'
export const tellorAddressMumbai = '0xce4e32fe9d894f8185271aa990d2db425df3e6be'
export const tellorAddressGoerli = '0x51c59c6cAd28ce3693977F2feB4CfAebec30d8a2'
export const tellorAddressGnosismain = '0xAAd66432d27737ecf6ED183160Adc5eF36aB99f2'
export const tellorAddressChiado = '0xe7147C5Ed14F545B4B17251992D1DB2bdfa26B6d'
export const tellorAddressOpmain = '0xaf8cA653Fa2772d58f4368B0a71980e9E3cEB888'
export const tellorAddressOptest = '0x3251838bd813fdf6a97D32781e011cce8D225d59'
export const tellorAddressArbone = '0xd58D345Fd9c82262E087d2D0607624B410D88242'
export const tellorAddressArbtest = '0x8d1bB5eDdFce08B92dD47c9871d1805211C3Eb3C'
export const autopayAddressPolygon ='0x9BE9B0CFA89Ea800556C6efbA67b455D336db1D0'
export const autopayAddressMumbai = '0x9BE9B0CFA89Ea800556C6efbA67b455D336db1D0'
export const autopayEthMainnet = '0x9BE9B0CFA89Ea800556C6efbA67b455D336db1D0'
export const autopayGoerli = '0x9BE9B0CFA89Ea800556C6efbA67b455D336db1D0'
export const autopayGnosismain = '0x9BE9B0CFA89Ea800556C6efbA67b455D336db1D0'
export const autopayChiado = '0x9BE9B0CFA89Ea800556C6efbA67b455D336db1D0'
export const autopayOpmain = '0x9BE9B0CFA89Ea800556C6efbA67b455D336db1D0'
export const autopayOptest = '0x9BE9B0CFA89Ea800556C6efbA67b455D336db1D0'
export const autopayArbone = '0x9BE9B0CFA89Ea800556C6efbA67b455D336db1D0'
export const autopayArbtest = '0x60cBf3991F05a0671250e673Aa166e9D1A0C662E'


export const getAssetBalances = async (web3, address, chainId) => {
  //Instantiating Contracts
  const trbContractEthereum = new web3.eth.Contract(minABI,tellorAddressMainnet)
  const trbContractPolygon = new web3.eth.Contract(minABI, tellorAddressPolygon)
  const trbContractMumbai = new web3.eth.Contract(minABI, tellorAddressMumbai)
  const trbContractGoerli = new web3.eth.Contract(minABI, tellorAddressGoerli)
  const trbContractGnosismain = new web3.eth.Contract(minABI, tellorAddressGnosismain)
  const trbContractChiado = new web3.eth.Contract(minABI, tellorAddressChiado)
  const trbContractOpmain = new web3.eth.Contract(minABI, tellorAddressOpmain)
  const trbContractOptest = new web3.eth.Contract(minABI, tellorAddressOptest)
  const trbContractArbone = new web3.eth.Contract(minABI, tellorAddressArbone)
  const trbContractArbtest = new web3.eth.Contract(minABI, tellorAddressArbtest)
  //Function Globals
  let chainMainTokenBalance
  let trbBalance

  switch (chainId) {
    case 1:
      //Main Chain Balance - ETHEREUM MAINNET
      chainMainTokenBalance = web3.utils.fromWei(
        await web3.eth.getBalance(address)
      )
      trbBalance = await trbContractEthereum.methods
        .balanceOf(address)
        .call()
        .then((res) => web3.utils.fromWei(res))
      console.log(trbBalance)
      //Add more assets here if needed
      return {
        main: Math.round(chainMainTokenBalance * 100) / 100,
        trb: Math.round(trbBalance * 100) / 100,
      }
    case 4:
      //Main Chain Balance - RINKEBY
      chainMainTokenBalance = web3.utils.fromWei(
        await web3.eth.getBalance(address)
      )
      trbBalance = await trbContractEthereum.methods
        .balanceOf(address)
        .call()
        .then((res) => web3.utils.fromWei(res))
      //Add more assets here if needed
      return {
        main: Math.round(chainMainTokenBalance * 100) / 100,
        trb: Math.round(trbBalance * 100) / 100,
      }
    case 5:
      //Main Chain Balance - GOERLI
      chainMainTokenBalance = web3.utils.fromWei(
        await web3.eth.getBalance(address)
      )
      trbBalance = await trbContractGoerli.methods
        .balanceOf(address)
        .call()
        .then((res) => web3.utils.fromWei(res))
      //Add more assets here if needed
      return {
        main: Math.round(chainMainTokenBalance * 100) / 100,
        trb: Math.round(trbBalance * 100) / 100,
      }
    case 137:
      //Main Chain Balance - MATIC/POLYGON MAINNET
      chainMainTokenBalance = web3.utils.fromWei(
        await web3.eth.getBalance(address)
      )
      trbBalance = await trbContractPolygon.methods
        .balanceOf(address)
        .call()
        .then((res) => web3.utils.fromWei(res))
      //Add more assets here if needed
      return {
        main: Math.round(chainMainTokenBalance * 100) / 100,
        trb: Math.round(trbBalance * 100) / 100,
      }
    case 80001:
      //Main Chain Balance - MUMBAI
      chainMainTokenBalance = web3.utils.fromWei(
        await web3.eth.getBalance(address)
      )
      trbBalance = await trbContractMumbai.methods
        .balanceOf(address)
        .call()
        .then((res) => web3.utils.fromWei(res))
      //Add more assets here if needed
      return {
        main: Math.round(chainMainTokenBalance * 100) / 100,
        trb: Math.round(trbBalance * 100) / 100,
      }
      case 100:
      //Main Chain Balance - Gnosis
      chainMainTokenBalance = web3.utils.fromWei(
        await web3.eth.getBalance(address)
      )
      trbBalance = await trbContractGnosismain.methods
        .balanceOf(address)
        .call()
        .then((res) => web3.utils.fromWei(res))
      //Add more assets here if needed
      return {
        main: Math.round(chainMainTokenBalance * 100) / 100,
        trb: Math.round(trbBalance * 100) / 100,
      }
      case 10200:
      //Main Chain Balance - Chiado
      chainMainTokenBalance = web3.utils.fromWei(
        await web3.eth.getBalance(address)
      )
      trbBalance = await trbContractChiado.methods
        .balanceOf(address)
        .call()
        .then((res) => web3.utils.fromWei(res))
      //Add more assets here if needed
      return {
        main: Math.round(chainMainTokenBalance * 100) / 100,
        trb: Math.round(trbBalance * 100) / 100,
      }
      case 10:
      //Main Chain Balance - Optimism Mainnet
      chainMainTokenBalance = web3.utils.fromWei(
        await web3.eth.getBalance(address)
      )
      trbBalance = await trbContractOpmain.methods
        .balanceOf(address)
        .call()
        .then((res) => web3.utils.fromWei(res))
      //Add more assets here if needed
      return {
        main: Math.round(chainMainTokenBalance * 100) / 100,
        trb: Math.round(trbBalance * 100) / 100,
      }
      case 420:
      //Main Chain Balance - Optimism testnet
      chainMainTokenBalance = web3.utils.fromWei(
        await web3.eth.getBalance(address)
      )
      trbBalance = await trbContractOptest.methods
        .balanceOf(address)
        .call()
        .then((res) => web3.utils.fromWei(res))
      //Add more assets here if needed
      return {
        main: Math.round(chainMainTokenBalance * 100) / 100,
        trb: Math.round(trbBalance * 100) / 100,
      }
      case 42161:
      //Main Chain Balance - MUMBAI
      chainMainTokenBalance = web3.utils.fromWei(
        await web3.eth.getBalance(address)
      )
      trbBalance = await trbContractArbone.methods
        .balanceOf(address)
        .call()
        .then((res) => web3.utils.fromWei(res))
      //Add more assets here if needed
      return {
        main: Math.round(chainMainTokenBalance * 100) / 100,
        trb: Math.round(trbBalance * 100) / 100,
      }
      case 421613:
      //Main Chain Balance - Arbitrum Goerli
      chainMainTokenBalance = web3.utils.fromWei(
        await web3.eth.getBalance(address)
      )
      trbBalance = await trbContractArbtest.methods
        .balanceOf(address)
        .call()
        .then((res) => web3.utils.fromWei(res))
      //Add more assets here if needed
      return {
        main: Math.round(chainMainTokenBalance * 100) / 100,
        trb: Math.round(trbBalance * 100) / 100,
      }
    default:
      return null
  }
}

//SO FAR NOT USED, DELETE LATER IF NEEDED
export const sortDataByProperty = (prop, arr) => {
  arr.sort(function (a, b) {
    if (a[prop] < b[prop]) {
      return 1
    } else if (a[prop] > b[prop]) {
      return -1
    } else {
      return 0
    }
  })
  return arr
}

export const dateManipulator = (formData) => {
  //FOR THE FUTURE WHEN WE INCLUDE UTC TIMEZONE
  //AND LOCAL MACHINE TIME
  // const timezoneOffset = (new Date().getTimezoneOffset() / 60).toString()
  // const UTCDate = Math.round(
  //   new Date(
  //     `${digitToMonth[formData.startMonth]} ${formData.startDay}, ${
  //       formData.startYear
  //     } ${formData.startHourFirst}${formData.startHourSecond}:${
  //       formData.startMinuteFirst
  //     }${formData.startMinuteSecond}:00-0${timezoneOffset}:00`
  //   ).getTime() / 1000
  // )

  const localDate =
    new Date(
      `${digitToMonth[formData.startMonth]} ${formData.startDay}, ${
        formData.startYear
      } ${formData.startHourFirst}${formData.startHourSecond}:${
        formData.startMinuteFirst
      }${formData.startMinuteSecond}:00`
    ).getTime() / 1000

  return localDate
}

export const convertToSeconds = (amount, type) => {
  let total
  switch (type) {
    case 'minute':
      total = amount * 60
      return total
    case 'minutes':
      total = amount * 60
      return total
    case 'hour':
      total = amount * 60 * 60
      return total
    case 'hours':
      total = amount * 60 * 60
      return total
    case 'day':
      total = amount * 24 * 60 * 60
      return total
    case 'days':
      total = amount * 24 * 60 * 60
      return total
    default:
      return
  }
}*/