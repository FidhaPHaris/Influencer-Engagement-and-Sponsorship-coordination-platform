const Sdashboard = {
  template: `
    <div class="container mt-5">
      <div class="d-flex">
        <!-- Left Side: Compact Campaign Cards -->
        <div class="col-md-5">
          <h2>Your Campaigns</h2>
          <div class="d-flex justify-content-between mb-3">
            <router-link to="/campaign" class="btn btn-success">Create Campaign</router-link>
            <button @click="downloadResource" class="btn btn-success">Download campaigns</button>
            <span v-if='isWaiting'> Waiting </span>
          </div>
          <div v-if="campaigns.length" class="list-group">
            <div v-for="campaign in campaigns" :key="campaign.id" class="list-group-item mb-3">
              <h5 class="mb-1">{{ campaign.name }}</h5>
              <p class="mb-1">{{ campaign.description }}</p>
              <div class="d-flex justify-content-between">
                <div class="btn-group" role="group">
                  <router-link :to="'/view_campaign_details/' + campaign.id" class="btn btn-secondary btn-sm mx-1">View</router-link>
                  <router-link :to="'/edit_campaign/' + campaign.id" class="btn btn-primary btn-sm mx-1">Edit</router-link>
                  <button class="btn btn-danger btn-sm mx-1" @click="confirmDelete(campaign.id)">Delete</button>
                </div>
              </div>
            </div>
          </div>
          <p v-else>No campaigns found.</p>
        </div>
      </div>
    </div>
  
  `,
  data() {
    return {
      campaigns: [],
      isWaiting: false,
    };
  },
  async created() {
    try {
      const token = localStorage.getItem('token'); 
      const response = await fetch('/view_campaign', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch campaigns.');
      }
      this.campaigns = await response.json();
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  },
  methods: {
    formatDate(dateString) {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0'); 
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    },

    async confirmDelete(campaignId) {
      if (confirm('Are you sure you want to delete this Campaign?')) {
        await this.deleteCampaign(campaignId);
      }
    },

    async deleteCampaign(campaignId) {
      try {
        const token = localStorage.getItem('token'); 
        const response = await fetch(`/delete_campaign/${campaignId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to delete campaign.');
        }
        else{
          alert('Campaign deleted successfully.');
        }
        this.campaigns = this.campaigns.filter(campaign => campaign.id !== campaignId);
      } catch (error) {
        console.error('Error deleting campaign:', error);
        
      }
    },

    async downloadResource(){
      this.isWaiting = true
      const res = await fetch('/downloadcsv')
      const data = await res.json()
      if(res.ok){
        const taskId = data['task-id']
        const intv = setInterval(async ()=>{
          const csv_res = await fetch(`/getcsv/${taskId}`)
          if(csv_res.ok){
            this.isWaiting = false
            clearInterval(intv)
            window.location.href = `/getcsv/${taskId}`
          }
        }, 1000)
      }
    },

  }
};

export default Sdashboard;
