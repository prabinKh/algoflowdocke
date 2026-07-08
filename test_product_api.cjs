/**
 * This script tests the backend API connection and product creation.
 * Run it with: node test_product_api.js
 */
const http = require('http');

const testProduct = {
  name: "Test Connection Product",
  slug: "test-connection-product-" + Date.now(),
  category: "laptops", // valid category slug
  brand: "Apple", // brand name string
  price: 99.99,
  image: "https://via.placeholder.com/150",
  description: "Testing API connectivity",
  stockCount: 10,
  inStock: true
};

const body = JSON.stringify(testProduct);

const options = {
  hostname: '127.0.0.1',
  port: 8001,
  path: '/api/admin/products/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
};

console.log("Starting API Connectivity Test...");
console.log("Target: http://127.0.0.1:8001/api/admin/products/");

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log("Response Raw:", data);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log("SUCCESS! Connection is working and product was accepted.");
      console.log("Response:", data);
    } else {
      console.log("FAILED! Server returned an error.");
      console.log("Error Details:", data);
      
      if (data.includes("Incorrect type. Expected pk value, received str.")) {
        console.log("\nCRITICAL: The backend is STILL rejecting string brands despite the fix.");
      }
      if (res.statusCode === 403 || res.statusCode === 401) {
        console.log("\nNOTE: Authentication required. This test script doesn't include tokens.");
      }
    }
  });
});

req.on('error', (error) => {
  console.error("CONNECTION ERROR: Could not reach the server at http://127.0.0.1:8081");
  console.error("Make sure your Django server is running on port 8081.");
});

req.write(body);
req.end();
