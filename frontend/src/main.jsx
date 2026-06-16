import { createRoot } from 'react-dom/client'
import { BrowserRouter,Routes,Route} from "react-router-dom";
import axios from 'axios';
import './index.css'
import Home from './components/Home';
import { UserContextprovider } from './components/usercontext';
// Configure axios defaults

axios.defaults.withCredentials = true;
axios.defaults.baseURL ='http://localhost:8080';

createRoot(document.getElementById('root')).render(
<BrowserRouter>

<Routes>
<Route path="/*" element={<UserContextprovider><Home /></UserContextprovider>} />
</Routes>
</BrowserRouter> 
)

