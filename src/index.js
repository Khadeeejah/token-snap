const symbols = require('./symbols');
const token = require('./token');
const { getTokenPairSpotPrice } = require('./uniswap');

async function lookupHandler(args) {
  return await getTokenPairSpotPrice(args.tokenPair);
}

async function identifyHandler({ erc, address }) {
  if ([20, 721, 1155].includes(erc)) return token.is[`ERC${erc}`](address);
  if (typeof erc === 'undefined') return token.identify(address);
  throw new Error(`Unexpected ERC Specification ${erc}`);
}

module.exports.onRpcRequest = async ({ request }) => {
  try {
    switch (request.method) {
      case 'price_lookup':
        return { result: await lookupHandler(request.args) };
      case 'identify_token':
        return { result: await identifyHandler(request.args) };
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
