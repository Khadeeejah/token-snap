const uniswapService = require('./uniswap');
const complianceChecker = require('./token');

async function helloHandler(origin, request) {
  const { token0, token1 } = request;
  // const consent = await wallet.request({
  //   method: 'snap_confirm',
  //   params: [
  //     {
  //       prompt: `Hello, ${origin}!`,
  //       description: 'This custom confirmation is just for display purposes.',
  //       textAreaContent: `So you are trying to fetch spot prices for ${token0} and ${token1}`,
  //     },
  //   ],
  // });
  // if (!consent) {
  //   return 'Sad to see you go 😭';
  // }
  return uniswapService.returnTokenPairSpotPrice([token0, token1]);
}

async function complianceHandler(request) {
  const { erc, address } = request;
  const isCompliant = await complianceChecker[`checkerc${erc}compliance`](address);
  return { result: isCompliant };
}

module.exports.onRpcRequest = async ({ origin, request }) => {
  switch (request.method) {
    case 'hello':
      return await helloHandler(origin, request);
    case 'checkcompliance':
      return await complianceHandler(request);
    default:
      throw new Error('Method not found.');
  }
};
