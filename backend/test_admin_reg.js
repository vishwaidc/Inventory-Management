const axios = require('axios');

async function testAdminRegister() {
    try {
        const res = await axios.post('http://localhost:4000/api/auth/register', {
            name: 'Test Admin',
            email: 'admin_test_' + Date.now() + '@example.com',
            password: 'password123',
            role: 'admin'
        });
        console.log('Success:', res.data);
    } catch (err) {
        console.log('Error:', err.response?.status, err.response?.data);
    }
}

testAdminRegister();
