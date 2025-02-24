const Register = {
    template: `
    <div class="d-flex justify-content-center align-items-center vh-100">
      <div class="card shadow p-4 w-40">
        <h3 class="card-title text-center mb-4">Register</h3>
        <form @submit.prevent="register">
          <!-- Username -->
          <div class="form-group">
            <label for="username">Username</label>
            <input type="text" v-model="username" class="form-control" id="username" required>
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input type="text" v-model="email" class="form-control" id="email" required>
          </div>

          <!-- Password -->
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" v-model="password" class="form-control" id="password" required>
          </div>

          <!-- Role Selection -->
          <div class="form-group">
            <label for="role">Role</label>
            <select v-model="role" @change="roleChanged" class="form-control" id="role" required>
              <option value="">Select Role</option>
              <option value="sponsor">Sponsor</option>
              <option value="influencer">Influencer</option>
            </select>
          </div>

          <!-- Additional Fields for Sponsors -->
          <div v-if="role === 'sponsor'">
            <div class="form-group">
              <label for="company_name">Company Name</label>
              <input type="text" v-model="company_name" class="form-control" id="company_name" required>
            </div>
            <div class="form-group">
              <label for="industry">Industry</label>
              <input type="text" v-model="industry" class="form-control" id="industry" required>
            </div>
            <div class="form-group">
              <label for="budget">Budget</label>
              <input type="number" v-model="budget" class="form-control" id="budget" required>
            </div>
          </div>

          <!-- Additional Fields for Influencers -->
          <div v-if="role === 'influencer'">
            <div class="form-group">
              <label for="category">Category</label>
              <input type="text" v-model="category" class="form-control" id="category" required>
            </div>
            <div class="form-group">
              <label for="niche">Niche</label>
              <input type="text" v-model="niche" class="form-control" id="niche" required>
            </div>
            <div class="form-group">
              <label for="reach">Reach</label>
              <input type="text" v-model="reach" class="form-control" id="reach" required>
            </div>
          </div>

          <!-- Submit Button -->
          <button type="submit" class="btn btn-primary w-100 mt-3">Register</button>
        </form>

        <!-- Already have an account link -->
        <div class="text-center mt-4">
          <p>Already have an account? <a href="#" @click="goToLogin">Login here</a></p>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      username: '',
      email: '',
      password: '',
      role: '', 
      // Sponsor-specific fields
      company_name: '',
      industry: '',
      budget: null,
      // Influencer-specific fields
      category: '',
      niche: '',
      reach: ''
    };
  },
  methods: {
    roleChanged() {
      // Clear sponsor/influencer fields when role changes
      this.company_name = '';
      this.industry = '';
      this.budget = null;
      this.category = '';
      this.niche = '';
      this.reach = '';
    },
    async register() {
      const data = {
        username: this.username,
        email: this.email,
        password: this.password,
        role: this.role,
        // Include sponsor or influencer fields based on role
        company_name: this.role === 'sponsor' ? this.company_name : null,
        industry: this.role === 'sponsor' ? this.industry : null,
        budget: this.role === 'sponsor' ? this.budget : null,
        category: this.role === 'influencer' ? this.category : null,
        niche: this.role === 'influencer' ? this.niche : null,
        reach: this.role === 'influencer' ? this.reach : null
      };
      console.log(data);

      try {
        const response = await fetch('/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
          alert('Registration successful!');
          this.$router.push('/login');
        } else {
          alert(result.msg);
        }
      } catch (error) {
        console.error('Error registering:', error);
      }
    },
    goToLogin() {
      
      this.$router.push('/login');
    }
  }
};

export default Register;