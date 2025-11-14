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
        <Notif title="Welcome to Weave!" body="Seamlessly share files with peers, checkout the guide to learn how to use it" duration={4000}/>
        <section className="welcome">
            <div className="welcomecont">
                <h1>Direct Data Sharing with P2P Technology</h1>
                <p className="sub">Connect and share. Weave handles the complexity so you can share seamlessly.</p>
                <div className="btns">
                    <Link to="/demo" className="btn btn-primary">Get Started <span className="arrow">→</span></Link>
                    <a 
                          href="https://youtu.be/yEep-us8rA0?si=Nsm-9M6Dmp-yrITg" 
                          target="_blank" 
                          rel="noopener noreferrer"
                    >
                      <Buttonwhite text = "Watch Video" />
                    </a>
                </div>
            </div>
            <div className="scroll-indicator">
                <span></span>
            </div>
        </section>
        
        <section>
          <h6>CONCEPT</h6>
          <p className='welcomecont'>Ever wanted to share files with someone but your Google Drive was full and you were just scared of sharing files over shady file sharing platforms not knowing what they are going to do with your personal data? Fear not weave provides a way to share data with <strong>no limits, no fees,</strong> nothing in between, just YOU and the RECEIVER! No gimmicks, no login or signup required, fully private and protected, and <strong>completely secure</strong>.</p>
        </section>
        <section>
          <h6>CORE FEATURES</h6>
          <div className="cardcontainer">
            <Card number='01' heading='Easy to use' description='Only 4 steps to establish a connection, follow the guide provided for detailed explanation.' />
            <Card number='02' heading='Fast and Secure' description='All the data stays between you and the receiver, no one else can access it.' />
            <Card number='03' heading='Reliable' description='Each chunk can be verified, ensuring data integrity.' />
            <Card number='04' heading='No Quality Reduction' description='We ensure that all your data is sent as it is. bit to bit' />
            <Card number='05' heading='100% Peer-to-Peer' description='All data is shared directly between users without any central server.' />
            <Card number='06' heading='Lossless Transmission' description='We use hashing on each 16Kb chunk of data that is travelling to prevent data corruption incase of connection issues.' />
            
          </div>
        </section>
        {/* <section>
          <h6>TECH STACK</h6>
            
            <p><strong>Frontend:</strong> React JS</p>
            <p><strong>Backend:</strong> None</p> 
            <p><strong>Core Tech:</strong> WebRTC</p>
            <p><strong>Goal:</strong> Enable seamless P2P file sharing</p>
          
        </section> */}
      </main>
      <Footer />
    </>
  )
}

export default Home
