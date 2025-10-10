import { useState } from 'react'
// import './App.css'
import Card from './components/Card'
// import Header from './components/Header'
import Button, { Buttonwhite } from './components/Button'
import Footer from './components/Footer'
import './Demo.css'

function Demo() {
  const [connectionstate, setconnectionstate] = useState("disconnected");
  const [usertype, setusertype] = useState(null);
  const [step, setstep] = useState(0);

  const senderSection = (
    <div className="sectioncardK">
      
      <h2 className="sectiontitleK">You are now the Sender</h2>
      <p className="sectionsubK">Follow the steps below to initiate the connection:</p>

      <div className="sectionstepK">
        <h4>Create Connection (Step: I)</h4>
        <p className="sectiondescK">Share this with the receiver! (this is a big chunk of text)</p>
        <div className="buttonsK">
          
          {step === 0 ? <Button text="Copy Connection Link" onClick={() => setstep(1)} /> : <Buttonwhite text="Copied Successfully!"  />}
          {/* {step === 1 ? <Button text="Paste Peer Link" onClick={() => setstep(2)} /> : <Buttonwhite text="Paste Peer Link"  />} */}
        </div>
      </div>

      <div className="sectionstepK">
        <h4>Paste Receiver's Chunk (Step: IV)</h4>
        <p className="sectiondescK">Paste the chunk of text sent by the sender (just click the button)</p>
        <div className="buttonsK">
          {usertype === "sender" ? (step === 1 ? <Button text="Click to paste" onClick={() => setstep(2)} /> : (step === 0 ? <Buttonwhite text="Complete Previous Step!" /> : <Buttonwhite text="Pasted Successfully!" />)) : null}
          {usertype === "receiver" ? (step === 1 ? <Button text="Click to copy" onClick={() => setstep(2)} /> : (step === 0 ? <Buttonwhite text="Complete Previous Step!" /> : <Buttonwhite text="Pasted Successfully!" />)) : null}
        </div>
      </div>
    </div>
  );
  

    const receiverSection = (
    
    <div className="sectioncardK">
      
      <h2 className="sectiontitleK">You are now the Receiver</h2>
      <p className="sectionsubK">Follow the steps below to finish the connection:</p>
      <div className="sectionstepK">
        <h4>Connect to Peer (Step: II)</h4>
        <p className="sectiondescK">Paste the chunk of text sent by the sender (just click the button)</p>
        <div className="buttonsK">
          {step===0 ? <Button text="Paste Chunk" onClick={() => setstep(1)} /> : <Buttonwhite text="Pasted Sucessfully!" />}
        </div>
      </div>

      <div className="sectionstepK">
        <h4>Copy connection Chunk (Step: III)</h4>
        <p className="sectiondescK">Share this with the sender (this is a big chunk of text)</p>
        <div className="buttonsK">
          {usertype === "sender" ? (step === 1 ? <Button text="Click to paste" onClick={() => setstep(2)} /> : (step === 0 ? <Buttonwhite text="Complete Previous Step!" /> : <Buttonwhite text="Pasted Successfully!" />)) : null}
          {usertype === "receiver" ? (step === 1 ? <Button text="Click to copy" onClick={() => setstep(2)} /> : (step === 0 ? <Buttonwhite text="Complete Previous Step!" /> : <Buttonwhite text="Pasted Successfully!" />)) : null}
        </div>
      </div>
    </div>
  );
  const filesection = (
    <>
      <Card />
    </>

  )

  const completeconnectionfirst = (
    <>
      <p className='welcomecont'>Complete the above steps first to establish a connection. Follow the Guide if you feel stuck ↑</p>
      {/* { usertype === null ? <p className='welcomecont'>Select if you are sending or receiving files</p> : null } */}

    </>
  )

  return (
    <>
      {/* <Header/> */}
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
            { usertype === "sender" ? <Button text = "Sending" onClick={() => {setusertype("sender"); setstep(0);}}/> : <Buttonwhite text = "Sending" onClick={() => {setusertype("sender"); setstep(0);}}/> }
            { usertype === "receiver" ? <Button text = "Receiving" onClick={() => {setusertype("receiver"); setstep(0);}}/> : <Buttonwhite text = "Receiving" onClick={() => {setusertype("receiver"); setstep(0);}}/> }

          </span>
          <br/>
          <br/>
          { usertype === "sender" ? senderSection : null}
          { usertype === "receiver" ? receiverSection : null }

          
        </section>
        <section>
          <h6>UPLOAD FILES</h6>
          <input type="text"  placeholder='type in the msg'/>

          { connectionstate === "connected" ? filesection : completeconnectionfirst }
      
        </section>
      </main>
      <Footer />
    </>
  )
}

class weaveSender {
  constructor(log) {
    this.usertype = usertype
    this.lc = new RTCPeerConnection()
    this.dc = this.lc.createDataChannel("channel")
    this.dc.onmessage = e => log("Recieved: " + e.data)
    this.dc.onopen = e => log("Sender: connection open " + e.data)
    this.lc.onicecandidate = () => log("new icecandidate" + JSON.stringify(this.lc.localDescription))
    this.lc.createOffer().then(o => this.lc.setLocalDescription(o)).then(() => log("set sucessful"))
    // log(this.lc.localDescription)
  }
  senddata(data){
    this.dc.send(data)
  }
  answerofreceiver(answer=null) {
    if (answer){
      this.lc.setRemoteDescription(answer)
      console.log("new connection created finalized")
    }
  }
}

class weaveReceiver {
  constructor(log) {
    this.usertype = "receiver";
    this.rc = new RTCPeerConnection();

    this.rc.onicecandidate = () => log("new icecandidate" + JSON.stringify(this.rc.localDescription));
    this.rc.ondatachannel = e => {
      this.rc.dc = e.channel
      this.rc.dc.onmessage = e => log("Recieved: " + e.data)
      this.rc.dc.onopen = e => log("Receiver: connection open!")
    }

    // console.log(this.rc.localDescription) 
  }
  
  senddata(data){
    this.rc.dc.send(data)
  }

  offerbysender(offer=null) {
    if (offer){
        this.rc
          .setRemoteDescription(offer)
          .then(() => this.rc.createAnswer())
          .then((a) => this.rc.setLocalDescription(a))
          .then(() => log("Receiver: answer created and set"));

      // console.log("new connection created finalized")
    }
  }
}

export default Demo
