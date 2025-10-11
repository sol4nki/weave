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
  const [senderOffer, setSenderOffer] = useState(null); // zaruri hai stoprage ke for global scope
  const log = (msg) => console.log(msg);
  const [weaveclass, setweaveclass] = useState(null);

  const senderSection = (
    <div className="sectioncardK">
      <h2 className="sectiontitleK">You are now the Sender</h2>
      <p className="sectionsubK">Follow the steps below to initiate the connection:</p>

      <div className="sectionstepK">
        <h4>Create Connection (Step: I)</h4>
        <p className="sectiondescK">Share this with the receiver! (this is a big chunk of text)</p>
        <div className="buttonsK">

          {step === 0 ? <Button text="Copy Connection Chunk" onClick={async () => {
            const desc = await weaveclass.create();
            await handlecopy(desc);
            setstep(1);
          }} /> : <Buttonwhite text="Copied Successfully!" onClick={() => {setstep(1); handlecopy(weaveclass.create());}} />}
          {/* {step === 1 ? <Button text="Paste Peer Link" onClick={() => setstep(2)} /> : <Buttonwhite text="Paste Peer Link"  />} */}
        </div>
      </div>

      <div className="sectionstepK">
        <h4>Paste Receiver's Chunk (Step: IV)</h4>
        <p className="sectiondescK">Paste the chunk of text sent by the sender (just click the button)</p>
        <div className="buttonsK">
          {usertype === "sender" ? (step === 1 ? <Button text="Click to paste" onClick={async () => {
            
            setstep(2); 
            const data = await handlepaste();
            weaveclass.answerofreceiver(data);
            setconnectionstate("connected");

            }} /> : (step === 0 ? <Buttonwhite text="Complete Previous Step!" /> : <Buttonwhite text="Pasted Successfully!" />)) : null}
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
          {step===0 ? <Button text="Paste Chunk" onClick={
            async () => {setstep(1);
            // const localdesc = new weaveSender(log).create();
            const senderoffer = await handlepaste();
            setSenderOffer(senderoffer);
          }} /> : <Buttonwhite text="Pasted Sucessfully!" />}
        </div>
      </div>

      <div className="sectionstepK">
        <h4>Copy connection Chunk (Step: III)</h4>
        <p className="sectiondescK">Share this with the sender (this is a big chunk of text)</p>
        <div className="buttonsK">
          {usertype === "sender" ? (step === 1 ? <Button text="Click to paste" onClick={async () => {setstep(2); await handlepaste();}} /> : (step === 0 ? <Buttonwhite text="Complete Previous Step!" /> : <Buttonwhite text="Pasted Successfully!" />)) : null}
          {usertype === "receiver" ? (step === 1 ? <Button text="Click to copy" onClick={async () => 
            {
              setstep(2);
              if (senderOffer){
                console.log("Received offer from clipboard:", senderOffer);
                const reply = await weaveclass.offerbysender(JSON.parse(senderOffer));
                setconnectionstate("connected");
                await handlecopy(JSON.stringify(reply));

              }

            }} 
            /> : (step === 0 ? <Buttonwhite text="Complete Previous Step!" /> : <Buttonwhite text="Pasted Successfully!" />)) : null}
        </div>
      </div>
    </div>
  );
  const filesection = (
    <>
      <input type="text" onInput={(e) => weaveclass.senddata("hello from " + e.target.value)} />
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
            { usertype === "sender" ? <Button text = "Sending" onClick={() => {setusertype("sender"); setstep(0); setweaveclass(new weaveSender(log))}}/> : <Buttonwhite text = "Sending" onClick={() => {setusertype("sender"); setstep(0); setweaveclass(new weaveSender(log))}}/> }
            { usertype === "receiver" ? <Button text = "Receiving" onClick={() => {setusertype("receiver"); setstep(0); setweaveclass(new weaveReceiver(log))}}/> : <Buttonwhite text = "Receiving" onClick={() => {setusertype("receiver"); setstep(0); setweaveclass(new weaveReceiver(log))}}/> }

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
    this.log = log;
    this.usertype = "sender"
    this.lc = new RTCPeerConnection()
    this.dc = this.lc.createDataChannel("channel")
    this.dc.onmessage = e => this.log("Recieved: " + e.data)
    this.dc.onopen = e => this.log("Sender: connection open " + e.data)
    // log(this.lc.localDescription)
  }
  async create() {
    this.lc.onicecandidate = () => 
      this.log("new icecandidate: " + JSON.stringify(this.lc.localDescription));

    const offer = await this.lc.createOffer();
    await this.lc.setLocalDescription(offer);

    this.log("set successful");

    return JSON.stringify(this.lc.localDescription);
  }


  senddata(data) {
    if (this.lc.dc && this.lc.dc.readyState === "open") {
      this.lc.dc.send(data);
      this.log("sent: " + data);
    } else {
      this.log("DataChannel not open yet!");
    }
  }
  answerofreceiver(answer=null) {
    if (answer){
      this.lc.setRemoteDescription(JSON.parse(answer))
      this.log("new connection created finalized")

    }
  }
}

class weaveReceiver {
  constructor(log) {
    this.log = log;
    this.usertype = "receiver";
    this.rc = new RTCPeerConnection();

    this.rc.onicecandidate = () => this.log("new icecandidate" + JSON.stringify(this.rc.localDescription));
    this.rc.ondatachannel = e => {
      this.rc.dc = e.channel
      this.rc.dc.onmessage = e => this.log("Recieved: " + e.data)
      this.rc.dc.onopen = e => this.log("Receiver: connection open!")
    }

    // console.log(this.rc.localDescription) 
  }
  
  senddata(data) {
    if (this.rc.dc && this.rc.dc.readyState === "open") {
      this.rc.dc.send(data);
      this.log("sent: " + data);
    } else {
      this.log("DataChannel not open yet!");
    }
  }

  async offerbysender(offer = null) {
    if (offer) {
      await this.rc.setRemoteDescription(offer);
      const answer = await this.rc.createAnswer();
      await this.rc.setLocalDescription(answer);
      this.log("Receiver: answer created and set");
      return this.rc.localDescription; // fixed the coppying wala part cause i m dumb
    }
  }
}

const handlepaste = async () => {
  try {
    const text = await navigator.clipboard.readText();
    console.log("Pasted text:", text);
    return text;
  } catch (err) {
    console.error("Failed to read clipboard contents:", err);
    alert("Clipboard access failed. Make sure the website has permission to access clipboard.");
    return null;
  }
};

const handlecopy = async (text) => {
  console.log("copying...")
  try {
    await navigator.clipboard.writeText(text);
    console.log('Text copied to clipboard: ' + text);
  } catch (err) {
    console.error('Failed to copy text: ', err);
    alert("Clipboard access failed. Make sure the website has permission to access clipboard.");
  }
}

export default Demo
