const Vcampaign = {
  template: `
  
    <div class="container mt-5">
      <h2>Campaign Details</h2>
      <table class="table table-bordered mt-3" v-if="campaign">
        <tr>
          <th>Name</th>
          <td>{{ campaign.name }}</td>
        </tr>
        <tr>
          <th>Description</th>
          <td>{{ campaign.description }}</td>
        </tr>
        <tr>
          <th>Start Date</th>
          <td>{{ formatDate(campaign.start_date) }}</td>
        </tr>
        <tr>
          <th>End Date</th>
          <td>{{ formatDate(campaign.end_date) }}</td>
        </tr>
        <tr>
          <th>Budget</th>
          <td>{{ campaign.budget }}</td>
        </tr>
        <tr>
          <th>Visibility</th>
          <td>{{ campaign.visibility }}</td>
        </tr>
        <tr>
          <th>Goals</th>
          <td>{{ campaign.goals }}</td>
        </tr>
      </table>

      <!-- Display Ad Requests -->
      <h3>Ad Requests</h3>
      <table class="table table-bordered mt-3" v-if="campaign && campaign.ad_requests && campaign.ad_requests.length">
        <thead>
          <tr>
            <th>Influencer</th>
            <th>Requirements</th>
            <th>Payment Amount</th>
            <th>Messages</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="adRequest in campaign.ad_requests" :key="adRequest.id">
            <td>{{ adRequest.influencer }}</td>
            <td>{{ adRequest.requirements }}</td>
            <td>{{ adRequest.payment_amount }}</td>
            <td>{{ adRequest.messages }}</td>
            <td>{{ adRequest.status }}</td>
            <td>
            <button class="btn btn-primary" @click="openEditModal(adRequest)">Edit</button>
            <button class="btn btn-danger ml-2" @click="confirmDelete(adRequest.id)">Delete</button>
          </td>
          </tr>
        </tbody>
      </table>
      <p v-else>No ad requests available for this campaign.</p>

      <button @click="showAdRequestForm = true" class="btn btn-primary mt-3">Create Ad Request</button>
      
      <!-- Modal -->
      <div v-if="showAdRequestForm" class="modal-overlay" @click.self="showAdRequestForm = false">
        <div class="modal-content">
          <h3>Create Ad Request</h3>
          <form @submit.prevent="createAdRequest">
            <div class="form-group">
              <label for="influencer_id">Select Influencer</label>
              <select v-model="adRequest.influencer_id" id="influencer_id" class="form-control" required>
                <option v-if="influencers.length === 0" disabled>No influencers available</option>
                <option v-for="influencer in influencers" :key="influencer.id" :value="influencer.id">
                  {{ influencer.username }}
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
            <button @click="showAdRequestForm = false" type="button" class="btn btn-secondary">Cancel</button>
          </form>
          <p v-if="errorMessage" class="text-danger">{{ errorMessage }}</p>
        </div>
      </div>



      <!-- Edit Ad Request Modal -->
      <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
        <div class="modal-content">
          <h3>Edit Ad Request</h3>
          <form @submit.prevent="updateAdRequest">
            <div class="form-group">
              <label for="edit_influencer_id">Select Influencer</label>
              <select v-model="editForm.influencer_id" id="edit_influencer_id" class="form-control" required>
                <option v-for="influencer in influencers" :key="influencer.id" :value="influencer.id">
                  {{ influencer.username }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label for="edit_requirements">Requirements</label>
              <textarea v-model="editForm.requirements" id="edit_requirements" class="form-control" required></textarea>
            </div>
            <div class="form-group">
              <label for="edit_payment_amount">Payment Amount</label>
              <input v-model="editForm.payment_amount" id="edit_payment_amount" type="number" class="form-control" required />
            </div>
            <div class="form-group">
              <label for="edit_messages">Messages</label>
              <textarea v-model="editForm.messages" id="edit_messages" class="form-control"></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Update</button>
            <button @click="showEditModal = false" type="button" class="btn btn-secondary">Cancel</button>
          </form>
          <p v-if="errorMessage" class="text-danger">{{ errorMessage }}</p>
        </div>
      </div>
      
      
    </div>
  
  `,
  data() {
    return {
      campaign: null,
      showAdRequestForm: false,
      showEditModal: false,
      adRequest: {
        influencer_id: '',
        requirements: '',
        payment_amount: '',
        messages: ''
      },
      editForm: {
        id: '',
        influencer_id: '',
        requirements: '',
        payment_amount: '',
        messages: ''
      },
      influencers: [],
      errorMessage: ''
    };
  },
  async created() {
    await this.fetchCampaignDetails();
  },
  methods: {
    formatDate(dateString) {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0'); 
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    },
    openEditModal(adRequest) {
      this.editForm = { ...adRequest }; 
      this.showEditModal = true; 
    },
    async fetchCampaignDetails() {
      const campaignId = this.$route.params.id;
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`/view_campaign_details/${campaignId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          this.campaign = data;
          this.influencers = data.influencers || [];
        } else {
          console.error('Error fetching campaign details:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching campaign details:', error);
      }
    },
    
    async createAdRequest() {
      this.errorMessage = ''; 
      try {
        const token = localStorage.getItem('token'); 
        const response = await fetch('/ad_request', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            campaign_id: this.campaign.id,
            influencer_id: this.adRequest.influencer_id,
            requirements: this.adRequest.requirements,
            payment_amount: this.adRequest.payment_amount,
            messages: this.adRequest.messages
          })
        });
        if (response.ok) {
          alert('Ad request created successfully.');
          
          await this.fetchCampaignDetails();
          this.showAdRequestForm = false;
        } else {
          throw new Error('Failed to create ad request.');
        }
      } catch (error) {
        this.errorMessage = 'Error creating ad request. Please try again.';
        console.error('Error creating ad request:', error);
      }
    },
    async updateAdRequest() {
      this.errorMessage = ''; 
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/edit_ad_request/${this.editForm.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            influencer_id: this.editForm.influencer_id,
            requirements: this.editForm.requirements,
            payment_amount: this.editForm.payment_amount,
            messages: this.editForm.messages
          })
        });
    
        if (response.ok) {
          alert('Ad request updated successfully.');
    
          
          await this.fetchCampaignDetails(this.campaign.id);
    
          this.showEditModal = false; 
        } else {
          throw new Error('Failed to update ad request.');
        }
      } catch (error) {
        this.errorMessage = 'Error updating ad request. Please try again.';
        console.error('Error updating ad request:', error);
      }
    },

    async confirmDelete(adRequestId) {
      if (confirm('Are you sure you want to delete this ad request?')) {
        await this.deleteAdRequest(adRequestId);
      }
    },

    async deleteAdRequest(adRequestId) {
      const token = localStorage.getItem('token'); 
      try {
        const response = await fetch(`/delete_ad_request/${adRequestId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
  
        if (response.ok) {
          
          alert('Ad request deleted successfully.');
  
          
          this.campaign.ad_requests = this.campaign.ad_requests.filter(adRequest => adRequest.id !== adRequestId);
        } else {
          const data = await response.json();
          throw new Error(data.msg || 'Failed to delete ad request.');
        }
      } catch (error) {
        console.error('Error deleting ad request:', error);
        alert('Error deleting ad request. Please try again.');
      }
    }

    
  }
};

export default Vcampaign;
