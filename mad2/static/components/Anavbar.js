const Anavbar = {
    template : `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <a class="navbar-brand" href="#">Admin Dashboard</a>
    <div class="collapse navbar-collapse">
      <ul class="navbar-nav mr-auto">
        <li class="nav-item">
          <router-link class="nav-link" to="/adashboard">Dashboard</router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/manage_campaigns">Manage Campaigns</router-link>
        </li>
        <li class="nav-item">
          <router-link class="nav-link" to="/manage_user">Manage User</router-link>
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

export default Anavbar;