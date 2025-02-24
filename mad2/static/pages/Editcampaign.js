const Editcampaign = {
    template: `
      <div class="container mt-5">
        <h2>Edit Campaign</h2>
        <div v-if="campaign" class="card">
          <div class="card-body">
            <form @submit.prevent="updateCampaign">
              <div class="form-group">
                <label for="name">Name</label>
                <input v-model="campaign.name" type="text" class="form-control" id="name" required>
              </div>
              <div class="form-group">
                <label for="description">Description</label>
                <textarea v-model="campaign.description" class="form-control" id="description" rows="3" required></textarea>
              </div>
              <div class="form-group">
                <label for="start_date">Start Date</label>
                <input v-model="campaign.start_date" type="date" class="form-control" id="start_date" required>
              </div>
              <div class="form-group">
                <label for="end_date">End Date</label>
                <input v-model="campaign.end_date" type="date" class="form-control" id="end_date" required>
              </div>
              <div class="form-group">
                <label for="budget">Budget</label>
                <input v-model="campaign.budget" type="number" class="form-control" id="budget" required>
              </div>
              <div class="form-group">
                <label for="visibility">Visibility</label>
                <select v-model="campaign.visibility" class="form-control" id="visibility" required>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div class="form-group">
                <label for="goals">Goals</label>
                <textarea v-model="campaign.goals" class="form-control" id="goals" rows="3" required></textarea>
              </div>
              <button type="submit" class="btn btn-primary">Update Campaign</button>
            </form>
          </div>
        </div>
        <p v-else>Loading campaign data...</p>
      </div>
    `,
    data() {
      return {
        campaign: null
      };
    },
    async created() {
      const campaignId = this.$route.params.id; // Get the campaign ID from the route
      try {
        const token = localStorage.getItem('token'); 
        const response = await fetch(`/view_campaign_details/${campaignId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch campaign details.');
        }
        this.campaign = await response.json();
      } catch (error) {
        console.error('Error fetching campaign details:', error);
      }
    },
    methods: {
      async updateCampaign() {
        try {
          const campaignId = this.$route.params.id;
          const token = localStorage.getItem('token'); 
          const response = await fetch(`/edit_campaign/${campaignId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(this.campaign)
          });
          if (!response.ok) {
            throw new Error('Failed to update campaign.');
          }
          alert('Campaign updated successfully!');
          this.$router.push('/sdashboard'); 
        } catch (error) {
          console.error('Error updating campaign:', error);
        }
      }
    }
  };
  
  export default Editcampaign;
  