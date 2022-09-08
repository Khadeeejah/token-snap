const snapId = `local:${window.location.href}`;

document.querySelector('.lookupPrice').addEventListener('click', lookup);

const lookupButton = document.querySelector('button.lookupPrice');
const connectButton = document.querySelector('button.connect');
const identifyButton = document.querySelector('button.identifyToken');

const price = document.querySelector('#lookup-price');
const identity = document.querySelector('#token-identity');

lookupButton.addEventListener('click', lookup);
connectButton.addEventListener('click', connect);
identifyButton.addEventListener('click', tokenIdentify);

// here we get permissions to interact with and install the snap
async function connect() {
  // todo! check if we're already connected
  await ethereum.request({
    method: 'wallet_enable',
    params: [{ wallet_snap: { [snapId]: {} } }],
  });
}

async function snapRPC(method, args) {
  const response = await ethereum.request({
    method: 'wallet_invokeSnap',
    params: [snapId, { method, args }],
  });

  if ('error' in response) {
    throw Object.assign(
      new Error(
        `An error occurred while executing a snap method\n${[
          '-------- snap context --------',
          ...response.error.stack.split('\n').map(l => `  ${l}`),
          ...(response.error.errors || []).flatMap((error, i) => [
            '',
            ...[...(!i ? ['  Caused by:'] : []), ...error.stack.split('\n').map(l => `      ${l}`)],
          ]),
          '-------- snap context --------',
        ]
          .map(l => `      ${l}`)
          .join('\n')}`,
      ),
      { source: response.error },
    );
  }
  return response.result;
}

async function lookup() {
  const tokenPair = [
    document.querySelector('#lookup-tkn1').value,
    document.querySelector('#lookup-tkn2').value,
  ].filter(Boolean);
  if (tokenPair.length === 2) {
    price.innerText = 'Loading Price Data...';
    try {
      const response = await snapRPC('price_lookup', { tokenPair });
      const priceReport = [
        [response[tokenPair[0]].symbol, response[tokenPair[1]].symbol].join(' / '),
        `Price: ${response[tokenPair[0]].price}`,
      ].join('\n');
      price.innerText = priceReport;
    } catch (err) {
      console.error(err);
      if ('source' in err) {
        if (
          Array.isArray(err.source.errors) &&
          err.source.errors.every(
            error =>
              'meta' in error && error.meta.poolAddress === '0x0000000000000000000000000000000000000000',
          )
        )
          price.innerText = 'No Pool Exists For This Token Pair Combination';
        else price.innerText = err.source.message;
      } else price.innerText = 'An error occurred, check the console logs for more information';
    }
  } else price.innerText = 'Both inputs must be specified';
}

async function tokenIdentify() {
  const address = document.querySelector('#check-tkn').value;
  if (address) {
    identity.innerText = 'Identifying token...';
    try {
      const response = await snapRPC('identify_token', { /* erc: 20, */ address });
      const identityReport = [];
      if (response.isERC20) identityReport.push('ERC 20');
      if (response.isERC721) identityReport.push('ERC 721');
      if (response.isERC1155) identityReport.push('ERC 1155');
      if (identityReport.length) identity.innerText = identityReport.map(s => `  \u2022 ${s}`).join('\n');
      else identity.innerText = 'This address matches no token standards';
    } catch (err) {
      console.error(err);
      if ('source' in err) identity.innerText = err.source.message;
      else identity.innerText = 'An error occurred, check the console logs for more information';
    }
  } else identity.innerText = 'Address must be specified';
}
