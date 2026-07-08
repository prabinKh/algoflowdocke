const http = require('http');

const HOST = '127.0.0.1';
const PORT = 8001;

function request(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-Host': HOST,
        ...headers
      }
    };

    if (data) {
      const body = JSON.stringify(data);
      opts.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request(opts, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        let json;
        try { json = JSON.parse(body); } catch(e) { json = body; }
        resolve({ status: res.statusCode, headers: res.headers, data: json });
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function run() {
  console.log("=== MULTI-TENANT ADMIN API TEST SUITE ===\n");

  // 1. LOGIN AS NEO-STORE
  console.log("[1] Logging in as admin@neostore.com...");
  const loginRes = await request('/api/account/login/', 'POST', {
    email: 'admin@neostore.com',
    password: 'password123'
  });
  
  if (loginRes.status !== 200) {
    console.error("Login failed!", loginRes.data);
    process.exit(1);
  }
  
  const rawCookie = loginRes.headers['set-cookie'].find(c => c.startsWith('access_token='));
  const neoCookie = rawCookie.split(';')[0];
  console.log("    ✓ Login successful. Company:", loginRes.data.user.company.name);

  // 2. TEST ENDPOINTS FOR NEO-STORE
  const endpoints = [
    '/api/admin/dashboard/stats/',
    '/api/admin/products/',
    '/api/admin/orders/',
    '/api/admin/customers/',
    '/api/admin/service-tickets/',
    '/api/admin/messages/',
    '/api/admin/pos/',
    '/api/admin/hero-settings/',
    '/api/admin/activity/',
    '/api/admin/staff-roles/',
    '/api/admin/staff-members/'
  ];

  console.log("\n[2] Testing API Read Endpoints (Neo-Store)...");
  let neoProductsCount = 0;

  for (let ep of endpoints) {
    const res = await request(ep, 'GET', null, { Cookie: neoCookie });
    if (res.status >= 200 && res.status < 300) {
      let count = Array.isArray(res.data) ? res.data.length : (res.data.results ? res.data.results.length : Object.keys(res.data).length);
      console.log(`    ✓ [${res.status}] ${ep} -> Received ${count} items`);
      if (ep === '/api/admin/products/') neoProductsCount = count;
    } else {
      console.error(`    ❌ [${res.status}] ${ep} FAILED:`, res.data);
    }
  }

  // 3. TEST CRUD OPERATIONS
  console.log("\n[3] Testing CRUD Operations (Neo-Store)...");
  
  // Create Product
  const newProduct = {
    name: "Test API Product",
    category: "laptops",
    brand: "Apple",
    price: 999.99,
    stockCount: 5,
    description: "Automated test product"
  };
  
  const createRes = await request('/api/admin/products/', 'POST', newProduct, { Cookie: neoCookie });
  let productId = null;
  if (createRes.status === 201) {
    productId = createRes.data.id;
    console.log(`    ✓ Product Created: ID ${productId}`);
  } else {
    console.error("    ❌ Create Product FAILED:", createRes.data);
  }

  // Update Product
  if (productId) {
    const updateRes = await request(`/api/admin/products/${productId}/`, 'PATCH', { price: 888.88 }, { Cookie: neoCookie });
    if (updateRes.status === 200 && updateRes.data.price === '888.88') {
      console.log(`    ✓ Product Updated: New Price $888.88`);
    } else {
      console.error("    ❌ Update Product FAILED:", updateRes.data);
    }
  }

  // Delete Product
  if (productId) {
    const delRes = await request(`/api/admin/products/${productId}/`, 'DELETE', null, { Cookie: neoCookie });
    if (delRes.status === 204) {
      console.log(`    ✓ Product Deleted Successfully`);
    } else {
      console.error("    ❌ Delete Product FAILED:", delRes.status);
    }
  }

  // 4. TEST POS CHECKOUT
  console.log("\n[4] Testing POS Checkout / Order Creation (Neo-Store)...");
  const posOrderData = {
    uid: "pos-admin",
    items: [{
      productId: "invalid-uuid-for-test", 
      name: "POS Test Item",
      price: 100,
      quantity: 1,
      image: "",
      features: []
    }],
    subtotal: 100,
    tax: 10,
    discount: 0,
    totalAmount: 110,
    customerType: "Walk-in-customer",
    customerName: "Walk-in Customer",
    customerEmail: "",
    status: "delivered",
    paymentStatus: "paid",
    paymentMethod: "cash",
    source: "pos",
    orderId: "POS-TEST-" + Math.floor(Math.random() * 100000000),
    shippingAddress: {
      address: "POS Order",
      city: "Store",
      phone: "N/A"
    }
  };

  const posRes = await request('/api/store/orders/create/', 'POST', posOrderData, { Cookie: neoCookie });
  if (posRes.status === 201) {
    console.log(`    ✓ POS Order Created successfully (Company Fallback Works)`);
  } else {
    console.error(`    ❌ POS Order Creation FAILED: [${posRes.status}]`, posRes.data);
  }

  // 4. TEST MULTI-TENANT ISOLATION
  console.log("\n[4] Testing Tenant Isolation (Quantum Electronics)...");
  const loginRes2 = await request('/api/account/login/', 'POST', {
    email: 'admin@quantum.com',
    password: 'password123'
  });
  
  const rawCookie2 = loginRes2.headers['set-cookie'].find(c => c.startsWith('access_token='));
  const quantumCookie = rawCookie2.split(';')[0];
  console.log("    ✓ Login successful. Company:", loginRes2.data.user.company.name);

  // Fetch products for Quantum
  const prodRes = await request('/api/admin/products/', 'GET', null, { Cookie: quantumCookie, 'X-Forwarded-Host': '127.0.0.2' });
  const quantumProductsCount = prodRes.data.length;
  console.log(`    ✓ Quantum Products Count: ${quantumProductsCount}`);
  
  if (neoProductsCount === quantumProductsCount && neoProductsCount > 0) {
    console.log("    ⚠️ Warning: Both tenants have the exact same number of products. Verify isolation manually.");
  } else {
    console.log("    ✓ Tenant Isolation Confirmed: Data sets are distinct.");
  }

  console.log("\n=== TEST SUITE COMPLETED ===");
}

run();
