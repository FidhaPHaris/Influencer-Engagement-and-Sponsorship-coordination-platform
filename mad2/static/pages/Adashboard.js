const Adashboard = {
  template: `
    <div class="container mt-5">
      <h2>Welcome Admin</h2>

      <!-- Display Statistics -->
      <div v-if="stats" class="row">
        <div class="col-md-4 mb-4" v-for="(value, key) in stats" :key="key">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">{{ formatLabel(key) }}</h5>
              <p class="card-text">{{ value }}</p>
            </div>
          </div>
        </div>
      </div>

      <h2>Pending Sponsors</h2>
      <table class="table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Company Name</th>
            <th>Industry</th>
            <th>Budget</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sponsor in pendingSponsors" :key="sponsor.id">
            <td>{{ sponsor.username }}</td>
            <td>{{ sponsor.email }}</td>
            <td>{{ sponsor.company_name }}</td>
            <td>{{ sponsor.industry }}</td>
            <td>{{ sponsor.budget }}</td>
            <td>
              <button class="btn btn-success" @click="approveSponsor(sponsor.id)">Approve</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  data() {
    return {
      stats: null,
      pendingSponsors: [],
    };
  },
  async created() {
    // Fetch statistics
    try {
      const token = localStorage.getItem('token');
      const statsResponse = await fetch('/admin/dashboard_stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      this.stats = await statsResponse.json();

      // Fetch pending sponsors
      await this.fetchPendingSponsors();
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
  },
  methods: {
    formatLabel(key) {
      const labels = {
        total_users: 'Total Users',
        total_sponsors: 'Total Sponsors',
        total_influencers: 'Total Influencers',
        public_campaigns: 'Public Campaigns',
        private_campaigns: 'Private Campaigns',
        ad_requests: 'Total Ad Requests',
        flagged_campaigns_count: 'Flagged Campaigns',
        flagged_users_count: 'Flagged Users'
      };
      return labels[key] || key;
    },
    async fetchPendingSponsors() {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('/admin/pending_sponsors', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        this.pendingSponsors = await response.json();
      } catch (error) {
        console.error("Error fetching pending sponsors:", error);
      }
    },
    async approveSponsor(sponsorId) {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`/admin/approve_sponsor/${sponsorId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          alert("Sponsor approved successfully.");
          
          await this.fetchPendingSponsors();
        } else {
          const errorData = await response.json();
          alert(errorData.msg || "Failed to approve sponsor.");
        }
      } catch (error) {
        console.error("Error approving sponsor:", error);
      }
    }
  }
};

export default Adashboard;


  
  