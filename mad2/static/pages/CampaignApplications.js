const CampaignApplications = {
    template: `
      <div class="container mt-5">
        <h2>Campaign Applications</h2>
  
        <!-- Display error message if any -->
        <p v-if="errorMessage" class="text-danger">{{ errorMessage }}</p>
  
        <!-- Applications list -->
        <div class="row">
          <div v-for="application in applications" :key="application.application_id" class="col-md-4 mb-4">
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">{{ application.campaign_name }}</h5>
                <p><strong>Influencer:</strong> {{ application.influencer_name }}</p>
                <p><strong>Message:</strong> {{ application.message }}</p>
                <p><strong>Status:</strong> {{ application.status }}</p>
                
                <div v-if="!application.responded">
                  <div class="btn-group mt-3" role="group">
                    <button class="btn btn-success mx-1" @click="respondToApplication(application.application_id, 'accept')">Accept</button>
                    <button class="btn btn-danger mx-1" @click="respondToApplication(application.application_id, 'reject')">Reject</button>
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <p v-if="!applications.length && !loading">No applications found.</p>
        <div v-if="loading">Loading...</div>
      </div>
    `,
  
    data() {
      return {
        applications: [],
        errorMessage: '',
        loading: true,
      };
    },
  
    methods: {
      async fetchApplications() {
        const token = localStorage.getItem('token');
  
        try {
          const response = await fetch('/sponsor/campaign-applications', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
  
          if (response.ok) {
            this.applications = await response.json();
            // Initialize a property to track if the application has been responded to
            this.applications.forEach(app => {
              app.responded = app.status === 'Accepted' || app.status === 'Rejected';
            });
          } else {
            this.errorMessage = 'Failed to load applications.';
          }
        } catch (error) {
          this.errorMessage = 'Error fetching applications. Please try again.';
        } finally {
          this.loading = false;
        }
      },
  
      async respondToApplication(applicationId, action) {
        const token = localStorage.getItem('token');
        this.errorMessage = '';
  
        try {
          const response = await fetch(`/sponsor/campaign_application/${applicationId}/respond`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ action }),
          });
  
          if (response.ok) {
            alert(`Application ${action}ed successfully!`);
            // Update the status and mark the application as responded
            const application = this.applications.find(app => app.application_id === applicationId);
            application.status = action.charAt(0).toUpperCase() + action.slice(1) + 'ed';
            application.responded = true;
          } else {
            const data = await response.json();
            this.errorMessage = data.msg || 'Failed to respond to application.';
          }
        } catch (error) {
          this.errorMessage = 'Error responding to application. Please try again.';
        }
      },
    },
  
    async created() {
      
      await this.fetchApplications();
    },
  };
  
  export default CampaignApplications;
  
  