import router from "./utils/router.js";
import Navbar from './components/Navbar.js';
import Snavbar from './components/Snavbar.js';
import Inavbar from './components/Inavbar.js';
import Anavbar from './components/Anavbar.js';

new Vue({
    el: '#app',
    template: `
    <div>
        <component :is="navbarComponent"/>
        <router-view/>
    </div>
    `,
    router,
    data() {
        return {
            userRole: null 
        };
    },
    async created() {
        
        this.fetchUserRole();
    },
    methods: {
        async fetchUserRole() {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    const response = await fetch('/current_user', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (response.ok) {
                        const userData = await response.json();
                        this.userRole = userData.role; 
                    } else {
                        console.error('Failed to fetch user role.');
                    }
                } else {
                    console.log('No token found.');
                }
            } catch (error) {
                console.error('Error fetching user role:', error);
            }
        }
    },
    computed: {
        navbarComponent() {
            if (this.userRole === 'sponsor') {
                return Snavbar;
            } else if (this.userRole === 'influencer') {
                return Inavbar;
            } else if (this.userRole === 'admin') {
                return Anavbar;
            } else {
                return Navbar; 
            }
        }
    },
    components: {
        Navbar,
        Snavbar,
        Inavbar
    },
});
