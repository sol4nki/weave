import { useState } from 'react'
// import './App.css'
import Header from './components/Header'
import Button, { Buttonwhite } from './components/Button'
import Footer from './components/Footer'

function Guide() {
  return (
    <>
      <Header/>
      <main>
        <section className="welcome">
            <div className="welcomecont">
                <h1>Guide</h1>
                <p className="sub">Follow these steps in order to easily connect and share files, it can be a little daunting at first but don't worry, we'll guide you through it.</p>
            </div>
        </section>
        <section>
          <h6>STEPS</h6>
          <p className='welcomecont'>Receiving or Sending Files?</p>
          <Button text = "Receiving" />
          <Button text = "Sending" />
          <br/>
          <br/>
          <p className='welcomecont'>Create Connection: [only to be done by the sender]</p>
          <Button text = "Create Connection Link" />
          <Buttonwhite text = "Paste Peer Link" />
          <br/>
          <br/>
          <p className='welcomecont'>Connect to Peer: [only to be done by the receiver]</p>
          <Button text = "Paste Connection Link" />
          <br/>
          <p className='welcomecont'>Paste ICE candidates: [sender copies, receiver pastes]</p>
          <Button text = "Copy ICE Candidates" />
          <Button text = "Paste ICE Candidates" />
        </section>
        <section>
          <h6>FILES</h6>
      
        </section>
      </main>
      <Footer />
    </>
  )
}

export default Guide
