const Idashboard = {
  template: `
    <div class="container mt-5">
      <h2>Ad Requests</h2>

      <!-- Display error message if any -->
      <p v-if="errorMessage" class="text-danger">{{ errorMessage }}</p>

      <!-- Loading indicator -->
      <div v-if="loading">Loading...</div>

      <!-- Cards for ad requests -->
      <div v-if="adRequests.length" class="row">
        <div class="col-md-4 mb-3" v-for="adRequest in adRequests" :key="adRequest.id">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">{{ adRequest.campaign_name }}</h5>
              <h6 class="card-subtitle mb-2 text-muted">Sponsor: {{ adRequest.sponsor_name }}</h6>
              <h6 class="card-subtitle mb-2 text-muted">Status: {{ adRequest.status }}</h6>
              <button class="btn btn-primary mt-2" @click="viewAdRequest(adRequest)">View Details</button>
            </div>
          </div>
        </div>
      </div>

      <p v-if="!adRequests.length && !loading">No ad requests found.</p>

      <!-- Modal for viewing ad request details -->
      <div v-if="showAdRequestDetails" class="modal-overlay" @click.self="closeAdRequestModal">
        <div class="modal-content">
          <h3>Ad Request Details</h3>
          <p><strong>Campaign:</strong> {{ currentAdRequest.campaign_name }}</p>
          <p><strong>Sponsor:</strong> {{ currentAdRequest.sponsor_name }}</p>
          <p><strong>Requirements:</strong> {{ currentAdRequest.requirements }}</p>
          <p><strong>Payment Amount:</strong> {{ currentAdRequest.payment_amount }}</p>
          <p><strong>Messages:</strong> {{ currentAdRequest.messages }}</p>
          <p><strong>Status:</strong> {{ currentAdRequest.status }}</p>

          <!-- Display buttons conditionally inside modal -->
          <div v-if="currentAdRequest.status === 'Pending'">
            <button class="btn btn-success mt-2" @click="respondAdRequest(currentAdRequest, 'accept')">Accept</button>
            <button class="btn btn-danger mt-2" @click="respondAdRequest(currentAdRequest, 'reject')">Reject</button>
            <button class="btn btn-warning mt-2" @click="openNegotiateModal">Negotiate</button>
          </div>

          

          <button @click="closeAdRequestModal" class="btn btn-secondary mt-3">Close</button>
        </div>
      </div>

      <!-- Modal for negotiating payment amount -->
      <div v-if="showNegotiateModal" class="modal-overlay" @click.self="closeNegotiateModal">
        <div class="modal-content">
          <h3>Negotiate Payment</h3>
          <div class="form-group">
            <label for="paymentAmount">Payment Amount</label>
            <input v-model="negotiateAmount" id="paymentAmount" type="number" class="form-control" />
          </div>
          <button class="btn btn-primary mt-3" @click="submitNegotiation">Submit</button>
          <button class="btn btn-secondary mt-3" @click="closeNegotiateModal">Cancel</button>
        </div>
      </div>
    </div>
  `,

  data() {
    return {
      adRequests: [],
      errorMessage: '',
      loading: false,
      showAdRequestDetails: false,
      currentAdRequest: null,
      showNegotiateModal: false,
      negotiateAmount: 0
    };
  },

  methods: {
    async fetchAdRequests() {
      this.loading = true;
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('/influencer/ad_requests', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          this.adRequests = await response.json();
        } else {
          const data = await response.json();
          this.errorMessage = data.msg || 'Failed to fetch ad requests.';
        }
      } catch (error) {
        this.errorMessage = 'Error fetching ad requests. Please try again.';
      } finally {
        this.loading = false;
      }
    },

    // Method to view the full details of an ad request
    viewAdRequest(adRequest) {
      this.currentAdRequest = adRequest;
      this.showAdRequestDetails = true;
    },

    closeAdRequestModal() {
      this.showAdRequestDetails = false;
      this.currentAdRequest = null;
    },

    // Respond to ad request (accept/reject)
    async respondAdRequest(adRequest, action) {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`/influencer/ad_request/${adRequest.id}/respond`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ action }),
        });

        if (response.ok) {
          adRequest.status = action === 'accept' ? 'Accepted' : 'Rejected';
          this.closeAdRequestModal(); 
        } else {
          const data = await response.json();
          this.errorMessage = data.msg || 'Failed to respond to ad request.';
        }
      } catch (error) {
        this.errorMessage = 'Error responding to ad request. Please try again.';
      }
    },

    // Open negotiate modal
    openNegotiateModal() {
      this.showNegotiateModal = true;
      this.negotiateAmount = this.currentAdRequest.payment_amount; 
    },

    // Close negotiate modal
    closeNegotiateModal() {
      this.showNegotiateModal = false;
    },

    // Submit negotiation
    async submitNegotiation() {
      const token = localStorage.getItem('token');
      const adRequest = this.currentAdRequest;
      try {
        const response = await fetch(`/influencer/ad_request/${adRequest.id}/respond`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ action: 'negotiate', payment_amount: this.negotiateAmount }),
        });

        if (response.ok) {
          adRequest.status = 'Negotiated';
          adRequest.payment_amount = this.negotiateAmount;
          this.closeNegotiateModal(); 
          this.closeAdRequestModal(); 
        } else {
          const data = await response.json();
          this.errorMessage = data.msg || 'Failed to negotiate ad request.';
        }
      } catch (error) {
        this.errorMessage = 'Error negotiating ad request. Please try again.';
      }
    },
  },

  async created() {
    await this.fetchAdRequests();
  }
};

export default Idashboard;

