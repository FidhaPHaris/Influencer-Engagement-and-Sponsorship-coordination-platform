const CreateCampaign = {
    template: `
      <div class="container mt-5">
        <h2 class="text-center mb-4">Create a New Campaign</h2>
        <form @submit.prevent="submitCampaign">
          <div class="form-group mb-3">
            <label for="name">Campaign Name</label>
            <input type="text" v-model="name" class="form-control" id="name" required>
          </div>
  
          <div class="form-group mb-3">
            <label for="description">Campaign Description</label>
            <textarea v-model="description" class="form-control" id="description" rows="3" required></textarea>
          </div>
  
          <div class="form-group mb-3">
            <label for="start_date">Start Date</label>
            <input type="date" v-model="start_date" class="form-control" id="start_date" required>
          </div>
  
          <div class="form-group mb-3">
            <label for="end_date">End Date</label>
            <input type="date" v-model="end_date" class="form-control" id="end_date" required>
          </div>
  
          <div class="form-group mb-3">
            <label for="budget">Budget</label>
            <input type="number" v-model="budget" class="form-control" id="budget" required>
          </div>
  
          <div class="form-group mb-3">
            <label for="visibility">Visibility</label>
            <select v-model="visibility" class="form-control" id="visibility" required>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
  
          <div class="form-group mb-3">
            <label for="goals">Campaign Goals</label>
            <textarea v-model="goals" class="form-control" id="goals" rows="3" required></textarea>
          </div>
  
          <button type="submit" class="btn btn-primary w-100">Create Campaign</button>
        </form>
      </div>
    `,
    data() {
      return {
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        budget: null,
        visibility: 'public',  
        goals: ''
      };
    },
    methods: {
      async submitCampaign() {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('You need to log in first.');
          this.$router.push('/login');
          return;
        }
  
        const data = {
          name: this.name,
          description: this.description,
          start_date: this.start_date,
          end_date: this.end_date,
          budget: this.budget,
          visibility: this.visibility,
          goals: this.goals
        };
  
        try {
          const response = await fetch('/campaign', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`  
            },
            body: JSON.stringify(data)
          });
  
          if (!response.ok) {
            const errorData = await response.json();
            alert(errorData.msg || 'Failed to create campaign.');
            return;
          }
  
          const result = await response.json();
          alert(result.msg || 'Campaign created successfully!');
          this.$router.push('/sdashboard');
        } catch (error) {
          console.error('Error creating campaign:', error);
          alert('An error occurred while creating the campaign. Please try again.');
        }
      }
    }
  };
  
  export default CreateCampaign;
  