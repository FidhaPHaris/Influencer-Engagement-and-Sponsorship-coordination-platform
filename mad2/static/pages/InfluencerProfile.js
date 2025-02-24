const InfluencerProfile = {
    template: `
      <div class="container mt-5">
        <h2>Update Profile</h2>
  
        <!-- Display error message if any -->
        <p v-if="errorMessage" class="text-danger">{{ errorMessage }}</p>
  
        <!-- Form to update profile -->
        <form @submit.prevent="updateProfile">
          <div class="form-group">
            <label for="name">Name</label>
            <input v-model="username" id="name" type="text" class="form-control" required />
          </div>

          <div class="form-group">
            <label for="name">Email</label>
            <input v-model="email" id="email" type="text" class="form-control" required />
          </div>
  
          <div class="form-group">
            <label for="category">Category</label>
            <input v-model="category" id="category" type="text" class="form-control" required />
          </div>
  
          <div class="form-group">
            <label for="niche">Niche</label>
            <input v-model="niche" id="niche" type="text" class="form-control" required />
          </div>
  
          <div class="form-group">
            <label for="reach">Reach</label>
            <input v-model="reach" id="reach" type="text" class="form-control" required />
          </div>
  
          <button type="submit" class="btn btn-primary">Update Profile</button>
        </form>
      </div>
    `,
  
    data() {
      return {
        username: '',
        email: '',
        category: '',
        niche: '',
        reach: '',
        errorMessage: '',
      };
    },
  
    methods: {
      // Fetch the current profile data
      async fetchProfile() {
        const token = localStorage.getItem('token');
        if (!token) {
          this.errorMessage = 'No token found. Please log in.';
          return;
        }
  
        try {
          const response = await fetch('/influencer/profile', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
  
          console.log('Response:', response); 
  
          if (response.ok) {
            const data = await response.json();
            this.username = data.username;
            this.email = data.email;
            this.category = data.category;
            this.niche = data.niche;
            this.reach = data.reach;
          } else {
            const data = await response.json();
            this.errorMessage = data.msg || 'Failed to load profile data.';
          }
        } catch (error) {
          console.error('Error:', error); 
          this.errorMessage = 'Error fetching profile data. Please try again.';
        }
      },
  
      // Update the influencer profile
      async updateProfile() {
        const token = localStorage.getItem('token');
        this.errorMessage = '';
  
        if (!token) {
          this.errorMessage = 'No token found. Please log in.';
          return;
        }
  
        try {
          const response = await fetch('/influencer/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              username: this.username,
              email: this.email,
              category: this.category,
              niche: this.niche,
              reach: this.reach,
            }),
          });
  
          if (response.ok) {
            alert('Profile updated successfully!');
          } else {
            const data = await response.json();
            this.errorMessage = data.msg || 'Failed to update profile.';
          }
        } catch (error) {
          this.errorMessage = 'Error updating profile. Please try again.';
        }
      },
    },
  
    async created() {
      
      await this.fetchProfile();
    },
  };
  
  export default InfluencerProfile;
  
