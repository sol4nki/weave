import { useState } from 'react'
// import './App.css'
import Card from './components/Card'
import Header from './components/Header'
import Button, { Buttonwhite } from './components/Button'
import Footer from './components/Footer'

function Demo() {
  const [usertype, setusertype] = useState(null);
  const senderSection = (
    <>
      <p className="welcomecont">Create Connection: [only to be done by the sender]</p>
      <span style={{ display: 'flex', gap: '10px', flexDirection: 'row' }}>
        <Button text="Create Connection Link" />
        <Buttonwhite text="Paste Peer Link" />
      </span>
      <br />
      <br />
      <p className='welcomecont'>Paste ICE candidates: [sender copies, receiver pastes]</p>
      <span style={{display: 'flex', gap: '10px', flexDirection: 'row'}}>
      <Button text = "Copy ICE Candidates" />
      <Button text = "Paste ICE Candidates" />
      </span>
    </>
  )
  const receiverSection = (
    <>
      <p className='welcomecont'>Connect to Peer: [only to be done by the receiver]</p>
      <span style={{display: 'flex', gap: '10px', flexDirection: 'row'}}>
      <Button text = "Paste Connection Link and copy your connection Link" />
      </span>
      <br/>
      <p className='welcomecont'>Paste ICE candidates: [sender copies, receiver pastes]</p>
      <span style={{display: 'flex', gap: '10px', flexDirection: 'row'}}>
      <Button text = "Copy ICE Candidates" />
      <Button text = "Paste ICE Candidates" />
      </span>
    </>
  )

  return (
    <>
      <Header/>
      <main>
        <section className="welcome">
            <div className="welcomecont">
                <h1>DEMO</h1>
                <p className="sub">Connect and share. Weave will handle the rest.</p>
            </div>
        </section>
        <section>
          <h6>establish conneciton</h6>
          <p className='welcomecont'>Receiving or Sending Files?</p>
          <span style={{display: 'flex', gap: '10px', flexDirection: 'row'}}>
            <Button text = "Sending" onClick={() => setusertype("sender")}/>
            <Button text = "Receiving" onClick={() => setusertype("receiver")}/>
            
            {/* {console.log(usertype)} */}
          </span>
          <br/>
          <br/>
          { usertype === "sender" ? senderSection : null}
          { usertype === "receiver" ? receiverSection : null }

          
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
