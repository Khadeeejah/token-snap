const snapId = `local:${window.location.href}`;

document.querySelector('.lookupPrice').addEventListener('click', lookup);

const connectButton = document.querySelector('button.connect');
const lookupButton = document.querySelector('button.lookupPrice');
// const checkTokenButton = document.querySelector('button.checkToken');
const price = document.querySelector('#lookup-price');

connectButton.addEventListener('click', connect);
lookupButton.addEventListener('click', lookup);

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

function getTokenInputs() {
  const inputs = [document.querySelector('#lookup-tkn1').value, document.querySelector('#lookup-tkn2').value];
  return inputs.filter(Boolean);
}

async function lookup() {
  const tokenPair = getTokenInputs();
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
      } else price.innerHTML = err.message;
    }
  }
}

// async function checkTokenCompliance() {
//   const response = await snapRPC('check_compliance', {
//     erc: 20,
//     address: '0x08BA8CBbefa64Aaf9DF25e57fE3f15eCC277Af74',
//   });
//   alert('result from compliance ', response);

//   form.addEventListener('submit', event => {
//     // handle the form data
//     event.preventDefault();
//     console.log(event.target[0].value);
//     console.log(event.target[1].value);
//   });
// }
