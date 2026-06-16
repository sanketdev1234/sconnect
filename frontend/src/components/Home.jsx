// src/components/Home.jsx
import { Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import CreateMeeting from "./Meet/CreateMeeting";
import Login from "./Auth/Login";
import Signup from "./Auth/Signup";
import Showmeetdetail from "./Meet/Showmeetdetail";
import Userdashboard from "./Userdashboard";
import ScoketChat from "./Chat/ScoketChat";
import Contactsanket from "./Contactsanket";
import Joinmeeting from "./Meet/Joinmeet";
import NotFound from "./Notfound";
import ProfileCreation from "./profile/profilecreate";
import DisplayProfile from "./profile/profileview";
import UpdateProfile from "./profile/updateprofile";
import CreatePost from "./post/createpost";
import LandingPage from "./Landingpage";
import SeeAllPosts from "./post/seeallpost";
import EditPost from "./post/editpost";
import SeeAllPostsUser from "./post/seespecificpost";
import ShowmyConnections from "./connections/showmyconnections";
import Showincomingrequest from "./connections/incomingrequests";

const noSidebarRoutes = ['/', '/landingpage', '/login', '/signup'];

function Home() {
  const location = useLocation();
  const showSidebar = !noSidebarRoutes.includes(location.pathname);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {showSidebar && <Sidebar />}
      <div className={showSidebar ? "ml-64 flex-1 p-4" : "flex-1"}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/landingpage" element={<LandingPage />} />
          <Route path="/dashboard" element={<Userdashboard />} />
          <Route path="/newmeet" element={<CreateMeeting />} />
          <Route path="/joinmeet" element={<Joinmeeting />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/meet/:id/detail" element={<Showmeetdetail />} />
          <Route path="/ongoingmeet/:meetid/:joinid" element={<ScoketChat />} />
          <Route path="/contact" element={<Contactsanket />} />
          <Route path="/createprofile" element={<ProfileCreation />} />
          <Route path="/getprofile/:wantid" element={<DisplayProfile />} />
          <Route path="/updateprofile/:wantid/:profileId" element={<UpdateProfile />} />
          <Route path="/createpost" element={<CreatePost />} />
          <Route path="/editpost/:postId" element={<EditPost />} />
          <Route path="/feed" element={<SeeAllPosts />} />
          <Route path="/feed/:full_name" element={<SeeAllPostsUser />} />
          <Route path="/myconnections" element={<ShowmyConnections />} />
          <Route path="/incomingrequests" element={<Showincomingrequest />} />
          <Route path="/*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
}

export default Home;