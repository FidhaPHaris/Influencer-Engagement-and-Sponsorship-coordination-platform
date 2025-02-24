const Snavbar = {
    template : `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <a class="navbar-brand" href="#">Sponsor Dashboard</a>
    <div class="collapse navbar-collapse">
      <ul class="navbar-nav mr-auto">
        <li class="nav-item">
          <router-link class="nav-link" to="/sdashboard">Dashboard</router-link>
        </li>
        <li class="nav-item">
            <router-link class="nav-link" to="/search_influencers">Search Influencers</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/requests">Requests</router-link>
          </li>
      </ul>
      <div class="ml-auto d-flex align-items-center">
        <button class="btn btn-danger ml-2" @click="logout">Logout</button>
      </div>
      
    </div>
    </nav>
  `,
  methods: {
    logout() {
        localStorage.removeItem('token');
        this.$root.userRole = '';
        this.$router.push('/login');
    }
}
};

export default Snavbar;