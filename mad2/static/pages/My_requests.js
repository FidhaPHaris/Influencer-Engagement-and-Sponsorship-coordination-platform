const My_requests = {
    template: `
      <div class="container mt-5">
        <h2>Campaign Applications</h2>
  
        <!-- Display error message if any -->
        <p v-if="errorMessage" class="text-danger">{{ errorMessage }}</p>
  
        <!-- Loading indicator -->
        <div v-if="loading">Loading...</div>
  
        <!-- List of campaign applications -->
        <div v-if="applications.length" class="row">
          <div class="col-md-4 mb-3" v-for="application in applications" :key="application.id">
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">{{ application.campaign_name }}</h5>
                <h6 class="card-subtitle mb-2 text-muted">Sponsor: {{ application.sponsor_name }}</h6>
                <p><strong>Status:</strong> {{ application.status }}</p>
                <p><strong>Message:</strong> {{ application.message }}</p>
  
                <!-- Delete button -->
                <button class="btn btn-danger mt-2" @click="deleteApplication(application.id)">Delete</button>
              </div>
            </div>
          </div>
        </div>
  
        <p v-if="!applications.length && !loading">No campaign applications found.</p>
      </div>
    `,
  
    data() {
      return {
        applications: [],
        errorMessage: '',
        loading: false,
      };
    },
  
    methods: {
      async fetchApplications() {
        this.loading = true;
        const token = localStorage.getItem('token');
        
        try {
          const response = await fetch('/influencer/campaign_applications', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            this.applications = await response.json();
          } else {
            const data = await response.json();
            this.errorMessage = data.msg || 'Failed to fetch applications.';
          }
        } catch (error) {
          this.errorMessage = 'Error fetching applications. Please try again.';
        } finally {
          this.loading = false;
        }
      },
  
      async deleteApplication(applicationId) {
        const token = localStorage.getItem('token');
        try {
          const response = await fetch(`/influencer/campaign_application/${applicationId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
  
          if (response.ok) {
            this.applications = this.applications.filter(app => app.id !== applicationId);
          } else {
            const data = await response.json();
            this.errorMessage = data.msg || 'Failed to delete application.';
          }
        } catch (error) {
          this.errorMessage = 'Error deleting application. Please try again.';
        }
      }
    },
  
    async created() {
      await this.fetchApplications();
    },
  };
  
  export default My_requests;
  
  