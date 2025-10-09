import { useState } from 'react'
import './App.css'
import Card from './components/Card'
import Header from './components/Header'
import Button, { Buttonwhite } from './components/Button'
import Footer from './components/Footer'

function Demo() {
  return (
    <>
      <Header />
      <main>
        <section class="welcome">
            <div class="welcomecont">
                <h1>Direct Data Sharing with P2P Technology</h1>
                <p class="sub">Connect and share. Weave handles the complexity so you can share seamlessly.</p>
                <div class="btns">
                    <a href="#" class="btn btn-primary">Get Started <span class="arrow">→</span></a>
                    <Buttonwhite text = "Documentation" />
                </div>
            </div>
            <div class="scroll-indicator">
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
            <Card />
            <Card />
            <Card />
            <Card />
            <Card />
            <Card />
            
            
          </div>
        </section>
        <section>
          <h6>TECH STACK</h6>
            
            <p><strong>Frontend:</strong></p>
            <p><strong>Backend:</strong></p>
            <p><strong>Core Tech:</strong></p>
            <p><strong>Goal:</strong></p>
      
            
            
          
        </section>
      </main>
      <Footer />
    </>
  )
}

export default Demo
