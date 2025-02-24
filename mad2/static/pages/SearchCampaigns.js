const SearchCampaigns = {
    template: `
      <div class="container mt-5">
        <h2>Search Public Campaigns</h2>
  
        <!-- Budget filter input -->
        <div class="form-group">
          <label for="budget">Filter by Budget (Maximum)</label>
          <input v-model="budget" id="budget" type="number" class="form-control" placeholder="Enter max budget" />
        </div>
  
        <button class="btn btn-primary mt-3" @click="searchCampaigns">Search</button>
  
        <!-- Display error message if any -->
        <p v-if="errorMessage" class="text-danger">{{ errorMessage }}</p>
  
        <!-- Loading indicator -->
        <div v-if="loading">Loading...</div>
  
        <!-- Campaigns list -->
        <div v-if="campaigns.length" class="row mt-4">
          <div class="col-md-4 mb-3" v-for="campaign in campaigns" :key="campaign.id">
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">{{ campaign.name }}</h5>
                <p class="card-text">{{ campaign.description }}</p>
                <p><strong>Budget:</strong> {{ campaign.budget }}</p>
                <p><strong>Goals:</strong> {{ campaign.goals }}</p>
                <p><strong>Start Date:</strong> {{ formatDate(campaign.start_date) }}</p>
                <p><strong>End Date:</strong> {{ formatDate(campaign.end_date) }}</p>
                
                <!-- Conditional button or message based on application status -->
                <div v-if="!appliedCampaigns.includes(campaign.id)">
                  <button class="btn btn-success mt-2" @click="applyForCampaign(campaign.id)">Apply for Campaign</button>
                </div>
                <div v-else>
                  <span class="text-success">Applied for this campaign!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <p v-if="!campaigns.length && !loading">No campaigns found.</p>
      </div>
    `,
  
    data() {
      return {
        campaigns: [],
        budget: '',
        errorMessage: '',
        loading: false,
        appliedCampaigns: [], 
      };
    },
  
    methods: {
      async searchCampaigns() {
        this.loading = true;
        this.errorMessage = '';
        const token = localStorage.getItem('token');
        
        try {
          
          let url = '/influencer/search_campaigns';
          if (this.budget) {
            url += `?budget=${this.budget}`;
          }
  
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
  
          if (response.ok) {
            this.campaigns = await response.json();
          } else {
            const data = await response.json();
            this.errorMessage = data.msg || 'Failed to fetch campaigns.';
          }
        } catch (error) {
          this.errorMessage = 'Error fetching campaigns. Please try again.';
        } finally {
          this.loading = false;
        }
      },
  
      
      async applyForCampaign(campaignId) {
        const token = localStorage.getItem('token');
        const message = prompt('Enter a message for the sponsor (optional):');
  
        try {
          const response = await fetch(`/influencer/apply_campaign/${campaignId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ message }),
          });
  
          if (response.ok) {
            alert('Successfully applied for the campaign!');
            this.appliedCampaigns.push(campaignId); 
          } else {
            const data = await response.json();
            alert(data.msg || 'Failed to apply for the campaign.');
          }
        } catch (error) {
          alert('Error applying for the campaign. Please try again.');
        }
      },
  
      
      formatDate(date) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(date).toLocaleDateString(undefined, options);
      },
    },
  
    async created() {
      
      await this.searchCampaigns();
    }
  };
  
  export default SearchCampaigns;
  