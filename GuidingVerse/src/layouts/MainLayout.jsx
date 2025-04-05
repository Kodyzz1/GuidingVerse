import React from 'react';
import { Outlet, Link } from 'react-router-dom'; // Import Outlet and Link

function MainLayout() {
  return (
    <div>
      <header style={{ padding: '1rem', backgroundColor: '#eee' }}>
        <h1>GuidingVerse</h1>
        {/* Basic Navigation Example */}
        <nav>
          <Link to="/" style={{ marginRight: '10px' }}>Home</Link>
          <Link to="/reader" style={{ marginRight: '10px' }}>Reader</Link>
          <Link to="/profile" style={{ marginRight: '10px' }}>Profile</Link>
          <Link to="/login" style={{ marginRight: '10px' }}>Login</Link>
          <Link to="/about">About</Link>
        </nav>
      </header>
      <main style={{ padding: '1rem' }}>
        {/* Outlet renders the matched child route component */}
        <Outlet />
      </main>
      <footer style={{ padding: '1rem', backgroundColor: '#eee', marginTop: '2rem' }}>
        <p>&copy; {new Date().getFullYear()} GuidingVerse. </p>
        <Link to="/privacy" style={{ marginRight: '10px' }}>Privacy</Link>
        <Link to="/terms">Terms</Link>
      </footer>
    </div>
  );
}

export default MainLayout;