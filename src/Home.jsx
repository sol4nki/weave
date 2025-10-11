import { useState } from 'react'
import './Home.css'
import Card from './components/Card'
// import Header from './components/Header'
import Button, { Buttonwhite } from './components/Button'
import Footer from './components/Footer'
import { Link } from 'react-router-dom'
import Notif from './components/Notif'

function Home() {
  return (
    <>
      {/* <Header /> */}
      <main>
        <Notif/>
        <section className="welcome">
            <div className="welcomecont">
                <h1>Direct Data Sharing with P2P Technology</h1>
                <p className="sub">Connect and share. Weave handles the complexity so you can share seamlessly.</p>
                <div className="btns">
                    <Link to="/demo" className="btn btn-primary">Get Started <span className="arrow">→</span></Link>
                    <Buttonwhite text = "Watch Video" />
                </div>
            </div>
            <div className="scroll-indicator">
                <span></span>
            </div>
        </section>
        
        <section>
          <h6>CONCEPT</h6>
          <p className='welcomecont'>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
        </section>
        <section>
          <h6>CORE FEATURES</h6>
          <div className="cardcontainer">
            <Card number='01' heading='Easy to use' description='idk bruh' />
            <Card number='02' heading='Fast and Secure' description='idk bruh' />
            <Card number='03' heading='Reliable' description='idk bruh' />
            <Card number='04' heading='Direct Connection' description='idk bruh' />
            <Card number='05' heading='Fully P2P' description='idk bruh' />
            <Card number='06' heading='Lossless Transmission' description='idk bruh' />
            
          </div>
        </section>
        <section>
          <h6>TECH STACK</h6>
            
            <p><strong>Frontend:</strong> React JS</p>
            <p><strong>Backend:</strong> Python</p>
            <p><strong>Core Tech:</strong> WebRTC</p>
            <p><strong>Goal:</strong> Enable seamless P2P file sharing</p>
          
        </section>
      </main>
      <Footer />
    </>
  )
}

export default Home
