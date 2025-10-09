import { useState } from 'react'
// import './App.css'
import Card from './components/Card'
import Header from './components/Header'
import Button, { Buttonwhite } from './components/Button'
import Footer from './components/Footer'

function Demo() {
  return (
    <>
      <Header/>
      <main>
        <section class="welcome">
            <div class="welcomecont">
                <h1>DEMO</h1>
                <p class="sub">Connect and share. Weave will handle the rest.</p>
            </div>
        </section>
        <section>
          <h6>STEPS</h6>
          <p className='welcomecont'></p>
        </section>
        <section>
          <h6>FILES</h6>
      
        </section>
      </main>
      <Footer />
    </>
  )
}

export default Demo
