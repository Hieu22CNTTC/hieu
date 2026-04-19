import axios from 'axios';

const url = 'https://r.jina.ai/http://www.airportia.com/vietnam/noi-bai-international-airport/departures/';
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
];

async function runTest(name, headers) {
  console.log(`--- Testing ${name} ---`);
  try {
    const response = await axios.get(url, { headers, timeout: 10000 });
    console.log(`Status: ${response.status}`);
    console.log(`Body (200 chars): ${response.data.substring(0, 200)}`);
  } catch (error) {
    console.log(`Error Status: ${error.response ? error.response.status : error.code}`);
    if (error.response && error.response.data) {
       const dataStr = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data);
       console.log(`Error Body (200 chars): ${dataStr.substring(0, 200)}`);
    } else {
       console.log(`Error Message: ${error.message}`);
    }
  }
}

async function main() {
  await runTest('Variant 1 (Service Headers)', {
    'User-Agent': userAgents[0],
    'Accept': 'text/html,application/xhtml+xml'
  });

  await runTest('Variant 2 (Mozilla/5.0)', {
    'User-Agent': 'Mozilla/5.0'
  });

  await runTest('Variant 3 (No custom headers)', {});
}

main();
