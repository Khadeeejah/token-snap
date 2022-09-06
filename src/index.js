const { getTokenPairSpotPrice } = require('./uniswap');
const complianceChecker = require('./token');

async function lookupHandler(request) {
  return getTokenPairSpotPrice(request.tokens);
}

async function complianceHandler(request) {
  const { erc, address } = request;
  const isCompliant = await complianceChecker[`checkerc${erc}compliance`](address);
  return { result: isCompliant };
}

module.exports.onRpcRequest = async ({ request }) => {
  switch (request.method) {
    case 'lookup':
      return await lookupHandler(request);
    case 'checkcompliance':
      return await complianceHandler(request);
    default:
      throw new Error('Method not found.');
  }
};
