const provider = require('./provider');
const { ERC721, ERC1155, ERC20 } = require('./interfaces')(provider);

// ERC165: https://github.com/ethereum/EIPs/blob/e82a4aaf8e12fb68b7cdf3f8e56fb4434f327cba/EIPS/eip-165.md
function computeInterfaceId(contract, methods) {
  const interfaces = contract.options.jsonInterface.filter(
    entry => entry.type === 'function' && methods.includes(entry.name),
  );
  const unmatched = methods.filter(method => !interfaces.find(entry => entry.name === method));
  if (unmatched.length > 0) throw new Error(`Missing methods: ${unmatched.join(', ')}`);
  return `0x${interfaces
    .map(entry => BigInt(entry.signature))
    // eslint-disable-next-line no-bitwise
    .reduce((a, v) => a ^ v)
    .toString(16)}`;
}

const EXPECTED_ERRORS = [
  'execution reverted',
  [
    "Returned values aren't valid, did it run Out of Gas? You might also see this error if you",
    'are not using the correct ABI for the contract you are retrieving data from, requesting',
    'data from a block number that does not exist, or querying a node which is not fully synced',
  ].join(' '),
];

// https://github.com/OpenZeppelin/openzeppelin-contracts/blob/956d6632d9538f63c22d1eb71cda15f9848b56b7/contracts/token/ERC721/ERC721.sol#L54-L68
const ERC721Methods = [
  'balanceOf',
  'ownerOf',
  'safeTransferFrom',
  'transferFrom',
  'approve',
  'setApprovalForAll',
  'getApproved',
  'isApprovedForAll',
];

async function isERC721(address) {
  const contract = ERC721.at(address);
  try {
    return await contract.methods.supportsInterface(computeInterfaceId(contract, ERC721Methods)).call();
  } catch (e) {
    if (EXPECTED_ERRORS.some(msg => e.message.includes(msg))) return false;
    throw e;
  }
}

// https://github.com/OpenZeppelin/openzeppelin-contracts/blob/956d6632d9538f63c22d1eb71cda15f9848b56b7/contracts/token/ERC1155/ERC1155.sol#L27-L38
const ERC1155Methods = [
  'balanceOf',
  'balanceOfBatch',
  'setApprovalForAll',
  'isApprovedForAll',
  'safeTransferFrom',
  'safeBatchTransferFrom',
];

async function isERC1155(address) {
  const contract = ERC1155.at(address);
  try {
    return await contract.methods.supportsInterface(computeInterfaceId(contract, ERC1155Methods)).call();
  } catch (e) {
    if (EXPECTED_ERRORS.some(msg => e.message.includes(msg))) return false;
    throw e;
  }
}

async function isERC20(address) {
  const contract = ERC20.at(address);
  const NO_ONE = '0x0000000000000000000000000000000000000000';
  try {
    await Promise.all([
      contract.methods.symbol().estimateGas(),
      contract.methods.decimals().estimateGas(),
      contract.methods.totalSupply().estimateGas(),
      contract.methods.balanceOf(NO_ONE).estimateGas(),
      contract.methods.allowance(NO_ONE, NO_ONE).estimateGas(),
      // contract.methods.approve(NO_ONE, 0).estimateGas(),
      // contract.methods.transfer(NO_ONE, 0).estimateGas(),
      // contract.methods.transferFrom(NO_ONE, NO_ONE, 0).estimateGas(),
    ]);
    return true;
  } catch (e) {
    if (EXPECTED_ERRORS.some(msg => e.message.includes(msg))) return false;
    throw e;
  }
}

async function identify(address) {
  return (
    await Promise.all([
      isERC20(address).then(result => ({ isERC20: result })),
      isERC721(address).then(result => ({ isERC721: result })),
      isERC1155(address).then(result => ({ isERC1155: result })),
    ])
  ).reduce((a, v) => Object.assign(a, v));
}

module.exports = { identify, is: { ERC20: isERC20, ERC721: isERC721, ERC1155: isERC1155 } };

/* eslint-disable no-shadow, no-bitwise, node/no-process-exit */
async function test() {
  // top 20 ERC20 tokens on https://etherscan.io/tokens
  const erc20addresses = [
    '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    '0xB8c77482e45F1F44dE1745F52C74426C631bDD52', // BNB
    '0x4Fabb145d64652a948d72533023f6E7A623C7C53', // BUSD
    '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0', // MATIC
    '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', // SHIBA INU
    '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84', // stETH
    '0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39', // HEX
    '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
    '0x3883f5e181fccaF8410FA61e12b59BAd963fb645', // THETA
    '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
    '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // UNISWAP
    '0x2AF5D2aD76741191D15Dfe7bF6aC92d4Bd912Ca3', // LEO
    '0x75231F58b43240C9718Dd58B4967c5114342a86c', // OKB
    '0x85F17Cf997934a597031b2E18a9aB6ebD4B9f6a4', // NEAR
    '0x514910771AF9Ca656af840dff83E8264EcF986CA', // LINK
    '0xA0b73E1Ff0B80914AB6fe0444E65848C4C34450b', // CRO
    '0xD850942eF8811f2A866692A623011bDE52a462C1', // VENUS
    '0x6e1A19F235bE7ED8E3369eF73b196C07257494DE', // WFIL
    '0x853d955aCEf822Db058eb8505911ED77F175b99e', // FRAX
  ];

  // top 20 ERC721 tokens on https://etherscan.io/tokens-nft
  const erc721addresses = [
    '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
    '0xA35aa193f94A90eca0AE2a3fB5616E53C1F35193',
    '0x08febeB79431DBB9EF814d5dcF45A78DE5DA4EEA',
    '0xC6cE183fB60AD4A05d207EE740AF50Ff0614Cf04',
    '0x712B9720B37bd206ed938A5Fff4Ca48cb89643ba',
    '0x86af666B82E8e98B1C6882F89a27CD2467eD6A95',
    '0x0cf6D7a23560010cF24BcACaE65caA7E6F335F45',
    '0xb7Ab762D27959802AABFB0dDd8D45Df0817242Ed',
    '0x3a0916F7A5B1abbC468805358546667E186C8d7c',
    '0xCce1145Ec8955A2A4F4a94839B0Cd02f79C2b2Fc',
    '0xfD7c6A97ed8D42844dd163f5b3ab021202ac6802',
    '0xd59e4fA2e3bA26E386E964F697AE9289AF05A502',
    '0xf9eC6FfE7339b7f35A38c2653Ab2F4e4D4831421',
    '0x7fef3f3364C7d8B9BFabB1b24D5CE92A402c6Bd3',
    '0xE423bc41aEcD29889cA4975f90De54d9F30d4181',
    '0x86fc6f6c6702ceF7d3BaE87eF41256715416DB71',
    '0xE851F1Aec5fF34fD4088c806D3a061013680b5aE',
    '0x6d65CAEa21B74512C118E6BC67c4d3ab76912208',
    '0x7B408BB91B1b6994ca4Ed953115fe6Df88B426c0',
    '0x436cC556d9a9517d0808ACe3ba1F52Fe7A15d831',
  ];

  // top 20 ERC1155 tokens on https://etherscan.io/tokens-nft1155
  const erc1155addresses = [
    '0xa49a0e5eF83cF89Ac8aae182f22E6464B229eFC8',
    '0x495f947276749Ce646f68AC8c248420045cb7b5e',
    '0x232A68a51D6e07357ae025D2a459c16077327102',
    '0x76BE3b62873462d2142405439777e971754E8E77',
    '0xa342f5D851E866E18ff98F351f2c6637f4478dB5',
    '0x814EC748715f1e5B1B5C0A01fC0860569eB775e1',
    '0x9c1CD634f347d13209E43078C69f087Fd145B4b6',
    '0xc36cF0cFcb5d905B8B513860dB0CFE63F6Cf9F5c',
    '0x76430dB8E1eFFCce64C5Ce1F431aFcc81C0BFcC6',
    '0xF11282126A5C5f55dEda79b1761fEbfCd1468d4d',
    '0x7e9b9bA1A3B4873279857056279Cef6A4FCDf340',
    '0xbaC489f0eA3d8ec96d52d3663390706587aa9556',
    '0x7DaEC605E9e2a1717326eeDFd660601e2753A057',
    '0x4B4fA26161F7d9f387B01Ad6Bf0169Ba5b0F3A85',
    '0x10286D48d4A5700358b4576f12C4d4Fc274Ba056',
    '0x7cd73533f99F034fBa9bd66ec7ae9CeA30E268d2',
    '0xDdDc0Ae3a8B3700101d1d78B3b0275c72afa072B',
    '0xdDd6754c22ffAC44980342173fa956Bc7DDa018e',
    '0x8C1dd2E97941a09e6ff22aeF7e6177cd40F429bD',
    '0xd07dc4262BCDbf85190C01c996b4C06a461d2430',
  ];

  async function assert(pass, fail, fn, addresses) {
    let res = 0;
    for (const [addr, result] of await Promise.all(addresses.map(async addr => [addr, await fn(addr)])))
      if (!result) {
        res += 1;
        console.error(`\x1b[31m> [X]\x1b[0m ${addr} ${fail}`);
      } else console.log(`  \x1b[32m[+]\x1b[0m ${addr} ${pass}`);
    return res;
  }

  async function assertEq(_case, fn, addresses) {
    return await assert(`is ${_case}`, `is not ${_case}`, async addr => await fn(addr), addresses);
  }

  async function assertNeq(_case, fn, addresses) {
    return await assert(`is not ${_case}`, `is ${_case}`, async addr => !(await fn(addr)), addresses);
  }

  const tests = [
    assertEq('ERC 20', isERC20, erc20addresses),
    assertNeq('ERC 20', isERC20, erc721addresses),

    assertEq('ERC 721', isERC721, erc721addresses),
    assertNeq('ERC 721', isERC721, erc20addresses),

    assertEq('ERC 1155', isERC1155, erc1155addresses),
    assertNeq('ERC 1155', isERC1155, erc20addresses),
    assertNeq('ERC 1155', isERC1155, erc721addresses),

    // ERC 1155 can be ERC 20 and ERC 721 at the same time but not vice versa
    // assertNeq('ERC 20', isERC20, erc1155addresses),
    // assertNeq('ERC 721', isERC721, erc1155addresses),
  ];

  const nFailed = (await Promise.all(tests)).reduce((a, v) => a + v, 0);
  if (nFailed) {
    console.error(`\x1b[33m${nFailed}\x1b[0m test${nFailed - 1 ? 's' : ''} failed`);
    process.exit(1);
  }

  console.log('All Tests Passed!');
}

if (require.main === module) test();
