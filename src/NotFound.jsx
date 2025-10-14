import React from 'react';
import './NotFound.css';
import Header from './components/Header';

function NotFound() {
  return (
    <>
      <Header />
      <section>
            <div style={{backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center', height: '50vh', width: '100%', display: 'flex', flexDirection: 'column'}}>
                <h1 style={{fontSize: '6rem', fontWeight: '600', color: '#171717', marginBottom: '0px' }}>404</h1>
                <p className="sub" style={{fontSize: '1rem', fontWeight: '400', color: '#525252', marginTop: '0px'
                }}>Page Not Found</p>
                
            </div>
            
        </section>
    </>
  );
};

export default NotFound