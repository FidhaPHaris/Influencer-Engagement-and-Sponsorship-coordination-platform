const ManageUser = {
    template: `
      <div class="container mt-5">
        
  
        <!-- Sponsors Table -->
        <h3>Sponsors</h3>
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Company Name</th>
              <th>Industry</th>
              <th>Budget</th>
              <th>Flag Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sponsor in sponsors" :key="sponsor.id">
              <td>{{ sponsor.id }}</td>
              <td>{{ sponsor.username }}</td>
              <td>{{ sponsor.email }}</td>
              <td>{{ sponsor.company_name }}</td>
              <td>{{ sponsor.industry }}</td>
              <td>{{ sponsor.budget }}</td>
              <td>{{ sponsor.flagged ? 'Flagged' : 'Not Flagged' }}</td>
              <td>
                <button v-if="!sponsor.flagged" class="btn btn-danger" @click="flagUser(sponsor.id)">Flag</button>
                <button v-else class="btn btn-secondary" @click="unflagUser(sponsor.id)">Unflag</button>
              </td>
            </tr>
          </tbody>
        </table>
  
        <!-- Influencers Table -->
        <h3>Influencers</h3>
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Category</th>
              <th>Niche</th>
              <th>Reach</th>
              <th>Flag Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="influencer in influencers" :key="influencer.id">
              <td>{{ influencer.id }}</td>
              <td>{{ influencer.username }}</td>
              <td>{{ influencer.email }}</td>
              <td>{{ influencer.category }}</td>
              <td>{{ influencer.niche }}</td>
              <td>{{ influencer.reach }}</td>
              <td>{{ influencer.flagged ? 'Flagged' : 'Not Flagged' }}</td>
              <td>
                <button v-if="!influencer.flagged" class="btn btn-danger" @click="flagUser(influencer.id)">Flag</button>
                <button v-else class="btn btn-secondary" @click="unflagUser(influencer.id)">Unflag</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `,
    data() {
      return {
        sponsors: [],
        influencers: []
      };
    },
    async created() {
      const token = localStorage.getItem('token');
      try {
        // Fetch the list of sponsors
        const sponsorResponse = await fetch('/admin/sponsors', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        this.sponsors = await sponsorResponse.json();
  
        // Fetch the list of influencers
        const influencerResponse = await fetch('/admin/influencers', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        this.influencers = await influencerResponse.json();
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    },
    methods: {
      async flagUser(userId) {
        const token = localStorage.getItem('token');
        try {
          const response = await fetch(`/admin/flag_user/${userId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            
            this.sponsors = this.sponsors.map(user => user.id === userId ? { ...user, flagged: true } : user);
            this.influencers = this.influencers.map(user => user.id === userId ? { ...user, flagged: true } : user);
            alert('User flagged successfully.');
          } else {
            alert('Failed to flag user.');
          }
        } catch (error) {
          console.error('Error flagging user:', error);
        }
      },
      async unflagUser(userId) {
        const token = localStorage.getItem('token');
        try {
          const response = await fetch(`/admin/unflag_user/${userId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            
            this.sponsors = this.sponsors.map(user => user.id === userId ? { ...user, flagged: false } : user);
            this.influencers = this.influencers.map(user => user.id === userId ? { ...user, flagged: false } : user);
            alert('User unflagged successfully.');
          } else {
            alert('Failed to unflag user.');
          }
        } catch (error) {
          console.error('Error unflagging user:', error);
        }
      }
    }
  };
  
  export default ManageUser;
  