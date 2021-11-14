import {
	BrowserRouter as Router,
	Link,
	Switch,
	Route
} from 'react-router-dom';
import ChatPage from './components/ChatPage';
import Login from './components/Login';
import PrivateRoute from './components/PrivateRoute';
import Register from './components/Register';
import AuthProvider from './contexts/auth_context';

const App = () => {
	return (
		<AuthProvider>
			<Router>
				<nav style={{ position: 'fixed' }}>
					<ul>
						<li>
							<Link to ='/'>Home</Link>
							<br />

							<Link to ='/login'>Login</Link>
							<br />
							<Link to ='/register'>Register</Link>
						</li>
					</ul>
				</nav>
				<Switch>
					<PrivateRoute exact path='/' component={ ChatPage }></PrivateRoute>
					<Route path='/login' component={ Login } />
					<Route path='/register' component={ Register } />
				</Switch>
			</Router>
		</AuthProvider>
	);
}
export default App;