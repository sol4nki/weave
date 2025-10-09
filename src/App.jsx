import { useState } from 'react'
import './App.css'
import Card from './components/card'
import Header from './components/Header'
import Button, { Buttonwhite } from './components/Button'
import Footer from './components/Footer'

function App() {
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
        {/* <Button text="bro what?" /> */}
        <p className='titleinline'>FEATURES</p>
        <div className="cardcontainer">
          <Card />
          <Card />
          <Card />
          <Card />
          <Card />
          <Card />
          
          
        </div>
      </main>
      <Footer />
    </>
  )
}

export default App
