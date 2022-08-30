const uniswapService = require('./../services/uniswap');
const complianceChecker = require('./../services/token');

module.exports.onRpcRequest = async ({ origin, request }) => {
  switch (request.method) {
    case 'hello':
      const { token0, token1 } = request;
      const consent = await wallet.request({
        method: 'snap_confirm',
        params: [
          {
            prompt: `Hello, ${origin}!`,
            description:
              'This custom confirmation is just for display purposes.',
            textAreaContent: `So you are trying to fetch spot prices for ${token0} and ${token1}`,
          },
        ],
      });

      if (!consent) {
        return 'Sad to see you go 😭';
      }

      // const result = await uniswapService.returnPoolAddress({ token0, token1 });
      const result = await uniswapService.returnTokenPairSpotPrice({
        token0,
        token1,
      });

      return { result };

    case 'checkcompliance': 
      const {erc, address} = request;

      const isCompliant = await complianceChecker[`checkerc${erc}compliance`](address)

      return {result: isCompliant};
    default:
      throw new Error('Method not found.');
  }
};