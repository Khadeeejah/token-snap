const symbols = require('./symbols');
const complianceChecker = require('./token');
const { getTokenPairSpotPrice } = require('./uniswap');

async function lookupHandler(args) {
  return await getTokenPairSpotPrice(args.tokenPair);
}

async function complianceHandler(request) {
  const { erc, address } = request;
  const isCompliant = await complianceChecker[`checkerc${erc}compliance`](address);
  return { result: isCompliant };
}

module.exports.onRpcRequest = async ({ request }) => {
  try {
    switch (request.method) {
      case 'price_lookup':
        return { result: await lookupHandler(request.args) };
      case 'check_compliance':
        return { result: await complianceHandler(request.args) };
      default:
    }
  } catch (err) {
    const error = Object.assign(
      { message: err.message, stack: err.stack },
      err[symbols.errorMeta] ? { meta: err[symbols.errorMeta] } : {},
      err[symbols.nestedErrors]
        ? {
            errors: err[symbols.nestedErrors].map(cause =>
              Object.assign(
                {
                  message: cause.message,
                  stack: cause.stack,
                },
                cause[symbols.errorMeta] ? { meta: cause[symbols.errorMeta] } : {},
              ),
            ),
          }
        : {},
    );
    return { error };
  }

  throw new Error('Unsupported RPC method');
};
