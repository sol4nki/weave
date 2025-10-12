import { useState } from 'react'
// import './App.css'
// import Header from './components/Header'
import Button, { Buttonwhite } from './components/Button'
import Footer from './components/Footer'
import weaveLogo from './assets/weave-black.png';

import sender1 from './assets/Guide/sender_1.png';
import sender2 from './assets/Guide/sender_2.png';
import sender3 from './assets/Guide/sender_3.png';
import sender4 from './assets/Guide/sender_4.png';

import receiver1 from './assets/Guide/receiver_1.png';
import receiver2 from './assets/Guide/receiver_2.png';
import receiver3 from './assets/Guide/receiver_3.png';
import receiver4 from './assets/Guide/receiver_4.png';


function Guide() {
  return (
    <>
      {/* <Header/> */}
      <main>
        <section className="welcome">
            <div className="welcomecont">
                <h1>Guide</h1>
                <p className="sub">Follow these steps in order to easily connect and share files, it can be a little daunting at first but don't worry, we'll guide you through it.</p>
            </div>
        </section>
        <section>
          <h6>TLDR;</h6>
          <p className='welcomecont'>Just follow the step numbers provided next to the button section.</p>
          <p className='welcomecont'> Scrolldown to read in detail guide</p>
          <p><strong>Step I: Sender </strong> Generates chunk of text, then share with Receiver</p>
          <p><strong>Step II: Receiver </strong> Copies chunk of text sent by Sender, then click on Paste Button</p>
          <p><strong>Step III: Receiver </strong> Clicks on Copy button below, then share copied text with Sender</p>
          <p><strong>Step IV: Sender </strong> Copies text sent by Receiver, then click on "Click to Paste" button</p>
          <p className='welcomecont'> Scrolldown to read in detail guide x2</p>
        </section>
        <section>
          <h6>STEP FOR SENDER</h6>
          <p className='welcomecont'><strong>Step 1: </strong> Select "Sending" on the demo page</p>
          <img src={sender1} alt="step1" style={{width: '100%', maxWidth: '600px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'}}/>
          <p className='welcomecont'><strong>Step 2: </strong> Click on "Copy Connection Link", this will generate a chunk of text that you need to share with the receiver.</p>
          <img src={sender2} alt="step2" style={{width: '100%', maxWidth: '600px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'}}/>
          <p className='welcomecont'><strong>Step 3: </strong> Share the generated chunk of text with the receiver, through, email, chat, etc.</p>
          <img src={sender3} alt="step3" style={{width: '100%', maxWidth: '600px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'}}/>
          <p className='welcomecont'><strong>Step 4: </strong> Now the receiver will share a chunk of text with you copy it to your clipboard. </p>
          {/* <img src= alt="step4" style={{width: '100%', maxWidth: '600px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'}}/> */}

          <p className='welcomecont'><strong>Step 5: </strong> With the receiver's chunk of text in your clipboard, click on "Click to Paste" button. <br/> ANDDD Voila! Your connection should be successfully established and you can now share files with the receiver.</p>
          <img src={sender4} alt="step5" style={{width: '100%', maxWidth: '600px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'}}/>

          {/* <p className='welcomecont'><strong>Step 6: </strong> </p>
          <img src="/step6.png" alt="step6" style={{width: '100%', maxWidth: '600px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'}}/> */}
        </section>
        <section>
          <h6>STEPS FOR RECEIVER</h6>
          <p className='welcomecont'><strong>Step 1: </strong> Select "Receiving" on the demo page</p>
          <img src={receiver1} alt="step1" style={{width: '100%', maxWidth: '600px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'}}/>
          <p className='welcomecont'><strong>Step 2: </strong> The sender will share a chunk of text with you, that you need to copy to your clipboard.</p>
          {/* <img src= alt="step2" style={{width: '100%', maxWidth: '600px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'}}/> */}
          <p className='welcomecont'><strong>Step 3: </strong> With the sender's chunk of text in your clipboard, click on "Paste Chunk" button.</p>
          <img src={receiver2} alt="step3" style={{width: '100%', maxWidth: '600px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'}}/>
          <p className='welcomecont'><strong>Step 4: </strong> Now click on the "Click to copy" button to copy your connection chunk. (another chunk of text)</p>
          <img src={receiver3} alt="step4" style={{width: '100%', maxWidth: '600px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'}}/>
          <p className='welcomecont'><strong>Step 5: </strong> Share this new generated chunk of text with the sender, through, email, chat, etc.</p>
          <img src={receiver4} alt="step5" style={{width: '100%', maxWidth: '600px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'}}/>
          <p className='welcomecont'><strong>Step 6: </strong> Wait for receiver to complete their steps and then, Voila! Your connection should be successfully established and you can now share files with the receiver.</p>
          {/* <img src="/step6.png" alt="step6" style={{width: '100%', maxWidth: '600px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'}}/> */}
        </section>
      </main>
      <Footer />
    </>
  )
}

export default Guide
