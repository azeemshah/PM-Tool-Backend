const axios = require('axios');

// Get token first from login
async function testMembersAPI() {
  try {
    // Step 1: Login to get token
    console.log('Step 1: Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'user@gmail.com',
      password: 'password123' // This should match the password in DB
    });
    
    const token = loginResponse.data.data?.token || loginResponse.data.token;
    console.log('Token obtained:', token ? 'Yes' : 'No');
    
    // Step 2: Get workspaces
    console.log('\nStep 2: Getting workspaces...');
    const workspacesResponse = await axios.get('http://localhost:5000/api/v1/workspace/all', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const workspaces = workspacesResponse.data.data || workspacesResponse.data;
    console.log('Workspaces:', workspaces.length);
    
    if (workspaces.length > 0) {
      const workspaceId = workspaces[0]._id;
      console.log('Workspace ID:', workspaceId);
      
      // Step 3: Get members
      console.log('\nStep 3: Getting members...');
      const membersResponse = await axios.get(`http://localhost:5000/api/v1/members/workspace/${workspaceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Members response:');
      console.log(JSON.stringify(membersResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testMembersAPI();
