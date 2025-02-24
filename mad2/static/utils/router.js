
import Home from '../pages/Home.js';
import Login from '../pages/Login.js';
import Register from '../pages/Register.js';
import Adashboard from '../pages/Adashboard.js';
import Sdashboard from '../pages/Sdashboard.js';
import Idashboard from '../pages/Idashboard.js';
import CreateCampaign from '../pages/CreateCampaign.js';
import Vcampaign from '../pages/Vcampaign.js';
import Editcampaign from '../pages/Editcampaign.js';
import SearchInfluencers from '../pages/SearchInfluencers.js';
import SearchCampaigns from '../pages/SearchCampaigns.js';
import My_requests from '../pages/My_requests.js';
import InfluencerProfile from '../pages/InfluencerProfile.js';
import CampaignApplications from '../pages/CampaignApplications.js';
import ManageCamapigns from '../pages/ManageCampaigns.js';
import ManageUser from '../pages/ManageUser.js';




const routes = [
    { path : "/", component : Home },
    { path : "/login", component: Login},
    { path : "/register", component: Register},
    { path : "/adashboard", component: Adashboard},
    { path : "/sdashboard", component: Sdashboard},
    { path : "/idashboard", component: Idashboard},
    { path : "/campaign", component: CreateCampaign},
    { path: '/view_campaign_details/:id', component: Vcampaign },
    { path: '/edit_campaign/:id', component: Editcampaign },
    { path: '/search_influencers', component: SearchInfluencers },
    { path: "/search_campaigns", component: SearchCampaigns },
    { path: "/my_requests", component: My_requests},
    { path: "/profile", component: InfluencerProfile},
    { path: "/requests", component: CampaignApplications},
    { path: "/manage_campaigns", component: ManageCamapigns},
    {path: "/manage_user", component: ManageUser},
    
];

const router = new VueRouter({
    routes,
});


export default router;