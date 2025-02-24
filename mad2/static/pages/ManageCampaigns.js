const ManageCampaigns = {
  template: `
    <div>
      <div class="container mt-5">
        <h2>Campaigns</h2>
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Sponsor</th>
              <th>Description</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Budget</th>
              <th>Visibility</th>
              <th>Goal</th>
              <th>Flag Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="campaign in campaigns" :key="campaign.id">
              <td>{{ campaign.id }}</td>
              <td>{{ campaign.name }}</td>
              <td>{{ campaign.sponsor_name }}</td>
              <td>{{ campaign.description }}</td>
              <td>{{ campaign.start_date }}</td>
              <td>{{ campaign.end_date }}</td>
              <td>{{ campaign.budget }}</td>
              <td>{{ campaign.visibility }}</td>
              <td>{{ campaign.goals }}</td>
              <td>{{ campaign.flagged ? 'Flagged' : 'Not Flagged' }}</td>
              <td>
                <button v-if="!campaign.flagged" class="btn btn-danger" @click="flagCampaign(campaign.id)">Flag</button>
                <button v-else class="btn btn-secondary" @click="unflagCampaign(campaign.id)">Unflag</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="container mt-5">
        <h2>Ad Requests</h2>
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Campaign</th>
              <th>Influencer</th>
              <th>Messages</th>
              <th>Requirements</th>
              <th>Payment Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="adRequest in adRequests" :key="adRequest.id">
              <td>{{ adRequest.id }}</td>
              <td>{{ adRequest.campaign_name }}</td>
              <td>{{ adRequest.influencer_name }}</td>
              <td>{{ adRequest.messages }}</td>
              <td>{{ adRequest.requirements }}</td>
              <td>{{ adRequest.payment_amount }}</td>
              <td>{{ adRequest.status }}</td>
              
            </tr>
          </tbody>
        </table>
      </div>

      <div class="container mt-5">
      <h2>Request from Influencers</h2>
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Campaign</th>
            <th>Influencer</th>
            <th>Message</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="application in applications" :key="application.id">
            <td>{{ application.id }}</td>
            <td>{{ application.campaign_name }}</td>
            <td>{{ application.influencer_name }}</td>
            <td>{{ application.message }}</td>
            <td>{{ application.status }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    </div>
  `,
  data() {
    return {
      campaigns: [],
      adRequests: [],
      applications: [],
    };
  },
  async created() {
    const token = localStorage.getItem('token');
    try {
      const campaignsResponse = await fetch('/admin/campaigns', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      this.campaigns = await campaignsResponse.json();

      const adRequestsResponse = await fetch('/admin/ad_requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      this.adRequests = await adRequestsResponse.json();

      const response = await fetch('/admin/campaign_applications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      this.applications = await response.json();

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  },
  methods: {
    async flagCampaign(campaignId) {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`/admin/flag_campaign/${campaignId}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          this.campaigns = this.campaigns.map(campaign => 
            campaign.id === campaignId ? { ...campaign, flagged: true } : campaign
          );
          alert('Campaign flagged successfully.');
        } else {
          alert('Failed to flag campaign.');
        }
      } catch (error) {
        console.error('Error flagging campaign:', error);
      }
    },
    async unflagCampaign(campaignId) {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`/admin/unflag_campaign/${campaignId}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          this.campaigns = this.campaigns.map(campaign => 
            campaign.id === campaignId ? { ...campaign, flagged: false } : campaign
          );
          alert('Campaign unflagged successfully.');
        } else {
          alert('Failed to unflag campaign.');
        }
      } catch (error) {
        console.error('Error unflagging campaign:', error);
      }
    }
  },
};

export default ManageCampaigns;

  