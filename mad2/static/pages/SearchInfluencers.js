const SearchInfluencers = {
    template: `
      <div class="container mt-5">
        <h2>Search Influencers</h2>
        <form @submit.prevent="searchInfluencers">
          <div class="form-group mb-3">
            <label for="niche">Niche</label>
            <input v-model="niche" id="niche" type="text" class="form-control" placeholder="Enter niche" />
          </div>
          <div class="form-group mb-3">
            <label for="reach">Minimum Reach</label>
            <input v-model="reach" id="reach" type="text" class="form-control" placeholder="Enter reach" />
          </div>
          <button type="submit" class="btn btn-primary">Search</button>
        </form>
  
        <div v-if="loading" class="mt-3">Loading...</div>
        <div v-if="errorMessage" class="text-danger mt-3">{{ errorMessage }}</div>
  
        <table class="table table-bordered mt-3" v-if="influencers.length">
          <thead>
            <tr>
              <th>Influencer</th>
              <th>Niche</th>
              <th>Category</th>
              <th>Reach</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="influencer in influencers" :key="influencer.id">
              <td>{{ influencer.username }}</td>
              <td>{{ influencer.niche }}</td>
              <td>{{ influencer.category }}</td>
              <td>{{ influencer.reach }}</td>
              <td>
                <button @click="openAdRequestModal(influencer.id)" class="btn btn-primary">
                  Send Ad Request
                </button>
              </td>
            </tr>
          </tbody>
        </table>
  
        <p v-if="!influencers.length && !loading">No influencers found.</p>
  
        <!-- Modal for sending ad request -->
        <div v-if="showAdRequestForm" class="modal-overlay" @click.self="closeAdRequestModal">
          <div class="modal-content">
            <h3>Create Ad Request</h3>
            <form @submit.prevent="submitAdRequest">
              <div class="form-group">
                <label for="campaign">Select Campaign</label>
                <select v-model="selectedCampaign" id="campaign" class="form-control" required>
                  <option v-if="campaigns.length === 0" disabled>No campaigns available</option>
                  <option v-for="campaign in campaigns" :key="campaign.id" :value="campaign.id">
                    {{ campaign.name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label for="requirements">Requirements</label>
                <textarea v-model="adRequest.requirements" id="requirements" class="form-control" required></textarea>
              </div>
              <div class="form-group">
                <label for="payment_amount">Payment Amount</label>
                <input v-model="adRequest.payment_amount" id="payment_amount" type="number" class="form-control" required />
              </div>
              <div class="form-group">
                <label for="messages">Messages</label>
                <textarea v-model="adRequest.messages" id="messages" class="form-control"></textarea>
              </div>
              <button type="submit" class="btn btn-primary">Submit</button>
              <button @click="closeAdRequestModal" type="button" class="btn btn-secondary">Cancel</button>
            </form>
            <p v-if="errorMessage" class="text-danger">{{ errorMessage }}</p>
          </div>
        </div>
      </div>
    `,
    data() {
      return {
        niche: '',
        reach: '',
        influencers: [],
        campaigns: [],
        adRequest: {
          requirements: '',
          payment_amount: '',
          messages: ''
        },
        selectedCampaign: '',
        errorMessage: '',
        loading: false,
        showAdRequestForm: false,
        currentInfluencerId: null
      };
    },
    methods: {
      async searchInfluencers() {
        this.errorMessage = '';
        this.loading = true;
  
        const token = localStorage.getItem('token');
        const url = new URL('/search_influencers', window.location.origin);
        if (this.niche) url.searchParams.append('niche', this.niche);
        if (this.reach) url.searchParams.append('reach', this.reach);
  
        try {
          const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
  
          if (response.ok) {
            this.influencers = await response.json();
          } else {
            const data = await response.json();
            this.errorMessage = data.msg || 'Failed to fetch influencers.';
          }
        } catch (error) {
          this.errorMessage = 'Error fetching influencers. Please try again.';
          console.error('Error fetching influencers:', error);
        } finally {
          this.loading = false;
        }
      },
      openAdRequestModal(influencerId) {
        this.currentInfluencerId = influencerId;
        this.showAdRequestForm = true;
        this.fetchCampaigns(); 
      },
      closeAdRequestModal() {
        this.showAdRequestForm = false;
        this.currentInfluencerId = null;
        this.adRequest = {
          requirements: '',
          payment_amount: '',
          messages: ''
        };
      },
      async fetchCampaigns() {
        const token = localStorage.getItem('token');
        try {
          const response = await fetch('/view_campaign', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
  
          if (response.ok) {
            this.campaigns = await response.json();
          } else {
            const data = await response.json();
            this.errorMessage = data.msg || 'Failed to fetch campaigns.';
          }
        } catch (error) {
          this.errorMessage = 'Error fetching campaigns. Please try again.';
          console.error('Error fetching campaigns:', error);
        }
      },
      async submitAdRequest() {
        this.errorMessage = '';
        const token = localStorage.getItem('token');
        try {
          const response = await fetch('/ad_request', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              campaign_id: this.selectedCampaign,
              influencer_id: this.currentInfluencerId,
              requirements: this.adRequest.requirements,
              payment_amount: this.adRequest.payment_amount,
              messages: this.adRequest.messages
            })
          });
  
          if (response.ok) {
            alert('Ad request sent successfully.');
            this.closeAdRequestModal();
          } else {
            const data = await response.json();
            this.errorMessage = data.msg || 'Failed to send ad request.';
          }
        } catch (error) {
          this.errorMessage = 'Error sending ad request. Please try again.';
          console.error('Error sending ad request:', error);
        }
      }
    }
  };
  
  export default SearchInfluencers;
  