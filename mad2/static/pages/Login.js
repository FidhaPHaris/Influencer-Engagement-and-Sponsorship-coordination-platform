

const Login = {
  template: `
    <div class="d-flex justify-content-center align-items-center vh-100">
      <div class="card shadow p-4 border rounded-3">
        <h3 class="card-title text-center mb-4">Login</h3>
        <div class="form-group mb-3">
          <input v-model="username" type="text" class="form-control" placeholder="Username" required/>
        </div>
        <div class="form-group mb-4">
          <input v-model="password" type="password" class="form-control" placeholder="Password" required/>
        </div>
        <button class="btn btn-primary w-100" @click="submitInfo">Login</button>
        <div class="text-center mt-4">
        <p class="text-center">
          New User? <a href="#" @click="goToRegister">Register here</a>
        </p>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      username: "",
      password: "",
    };
  },
  methods: {
    async submitInfo() {
      const url = window.location.origin + '/login';
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: this.username, password: this.password }),
        });
  
        if (response.status === 403) {
          const errorData = await response.json();
          if (errorData.msg.includes("pending approval")) {
            alert("Your account is pending approval from an admin.");
          } else {
            alert("Your account has been flagged. Please contact support.");
          }
          return;
        }
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.msg || 'Login failed. Please try again.');
        }
  
        const result = await response.json();
        localStorage.setItem('token', result.access_token);
  
        // Decode the JWT token
        const decodedToken = jwt_decode(result.access_token);
        console.log("Decoded Token:", decodedToken);
  
        // Access the 'sub' field which contains the user info
        const userInfo = decodedToken.sub;
  
        if (!userInfo || !userInfo.role) {
          throw new Error('Token does not contain role information.');
        }
  
        const role = userInfo.role;
  
        this.$root.userRole = role;
  
        // Redirect based on role
        if (role === 'admin') {
          this.$router.push('/adashboard');
        } else if (role === 'sponsor') {
          this.$router.push('/sdashboard');
        } else if (role === 'influencer') {
          this.$router.push('/idashboard');
        } else {
          this.$router.push('/home');
        }
      } catch (error) {
        console.error("Login error:", error);
        alert(error.message || 'An error occurred while logging in. Please try again later.');
      }
    },
    goToRegister() {
      
      this.$router.push('/register');
    }
  }
  ,
};

export default Login;
