import { useState } from 'react'
// import './App.css'
import Card from './components/Card'
// import Header from './components/Header'
import Button, { Buttonwhite } from './components/Button'
import Footer from './components/Footer'
import './Demo.css'
import Notif from './components/Notif'

function Demo() {
  const [connectionstate, setconnectionstate] = useState("disconnected");
  const [usertype, setusertype] = useState(null);
  const [step, setstep] = useState(0);
  const [senderOffer, setSenderOffer] = useState(null); // zaruri hai stoprage ke for global scope
  const log = (msg) => {
    const container = document.getElementById('dbugconsole');
    const para = document.createElement('p');
    para.textContent = "> " + msg;
    container.appendChild(para);
    container.scrollTop = container.scrollHeight; // Auto-scroll to the bottom
    console.log(msg);
  };
  const [weaveclass, setweaveclass] = useState(null);
  const [notif, setNotif] = useState(null);




  const [messageToSend, setMessageToSend] = useState("");

  const sendSection = (
    <div className="sectioncardK">
      <h2 className="sectionsubK" style={{ color: "#444", marginBottom: "0px" }}>Send Debug Message</h2>
      <p className="sectionsubK">Send a test message to the connected peer. <br/>(Check the console below for received messages)</p>
      <div className="sectionstepK">
        <input
          type="text"
          value={messageToSend}
          onChange={(e) => setMessageToSend(e.target.value)}
          placeholder={connectionstate === "connected" ? "Type your debug message" : "Not connected yet wait for connection to establish"}
          style={{ padding: "10px", width: "100%", marginBottom: "10px" }}
          disabled={connectionstate !== "connected"}
        
        />
        <div className="buttonsK">
          <Button text="Send Message" onClick={() => {
            if (weaveclass && connectionstate === "connected") {
              weaveclass.senddata(messageToSend);
              setMessageToSend("");
            } else {
              log("Not connected or weaveclass undefined");
            }
          }} />
        </div>
      </div>
    </div>
  );









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
            setNotif(null);
                setTimeout(() => {
                setNotif({ title: "Copied Successfully!", body: "Share the link in your clipboard with the receiver." });
                }, 100);
            return;
          }} /> : 
          <Buttonwhite text="Copied Successfully!" onClick={async () => {
            setstep(1);
            const desc = await weaveclass.create();
            await handlecopy(desc);
            setNotif(null);
                setTimeout(() => {
                setNotif({ title: "Copied Successfully!", body: "Share the link in your clipboard with the receiver." });
                }, 100);
            return;
          }} />}
          {/* {step === 1 ? <Button text="Paste Peer Link" onClick={() => setstep(2)} /> : <Buttonwhite text="Paste Peer Link"  />} */}
        </div>
      </div>

      <div className="sectionstepK">
        <h4>Paste Receiver's Chunk (Step: IV)</h4>
        <p className="sectiondescK">Paste the chunk of text sent by the sender (just click the button)</p>
        <div className="buttonsK">
          {usertype === "sender" ? (step === 1 ? <Button text="Click to paste" onClick={async () => {
              const data = await handlepaste();
              
              if (!data) {

                setNotif(null);
                setTimeout(() => {
                setNotif({ title: "Clipboard empty", body: "clipboard empty make sure the entire chunk is copied." });
                }, 100);
                return;
              }

              const result = await weaveclass.answerofreceiver(data);
              if (result === 0) {
                
                setNotif(null);
                setTimeout(() => {
                  setNotif({ title: "Dont paste your own chunk!", body: "SHARE THIS WITH THE RECEIVER AND PASTE THE ONE THE RECEIVER SENT TO YOU!" });
                }, 100);
                return;

              } else if (result === 1) {
                // alert("Pasted successfully! Wait a few seconds for connection to finalize");
                setstep(2);
                setNotif(null);
                setconnectionstate("connected");
                setNotif(null);
                setTimeout(() => {
                  setNotif({ title: "Pasted successfully!", body: "Wait a few seconds for connection to finalize." });
                }, 100);
                return;
                
              } else if (result === -1) {
                setNotif(null);
                setTimeout(() => {
                  setNotif({ title: "Clipboard Error", body: "The clipboard is empty or chunk is partial." });
                }, 100);
                return;

                
              }
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
            setNotif(null);
                setTimeout(() => {
                setNotif({ title: "Pasted Successfully!", body: "You can now proceed to Step III." });
                }, 100);
            return;
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
                setNotif(null);
                setTimeout(() => {
                  setNotif({ title: "Copied Successfully!", body: "Share the chunk in your clipboard with the sender." });
                }, 100);
                return;

              }

            }} 
            /> : (step === 0 ? <Buttonwhite text="Complete Previous Step!" /> : <Buttonwhite text="Pasted Successfully!" />)) : null}
        </div>
      </div>
    </div>
  );
  // const filesection = (
  //   <>
  //     {/* <input type="text" onInput={(e) => weaveclass.senddata("hello from " + e.target.value)} /> */}
      
  //     <Card />
  //   </>

  // )

  const filesection = (
    <div className="sectioncardK">
      <h2 className="sectiontitleK">Upload Files</h2>
      <p className="sectionsubK">Select files to upload and send them to the connected peer.</p>
      {/* input bugging ill add it later */}

    </div>
  );


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
        {/* <Notif title="Dont paste your own chunk!" body="PASTE THE ONE THE RECEIVER SENT TO YOU!"/> */}
        {notif && <Notif title={notif.title} body={notif.body} />}
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
            { usertype === null ? <> <Buttonwhite text = "Sending" onClick={() => {setusertype("sender"); setstep(0); setweaveclass(new weaveSender(log))}}/> <Buttonwhite text = "Receiving" onClick={() => {setusertype("receiver"); setstep(0); setweaveclass(new weaveReceiver(log))}}/> </> : null }
            { usertype === "sender" ? <Button text = "Sending" onClick={() => {setusertype("sender"); setstep(0); setweaveclass(new weaveSender(log))}}/> : null }
            { usertype === "receiver" ? <Button text = "Receiving" onClick={() => {setusertype("receiver"); setstep(0); setweaveclass(new weaveReceiver(log))}}/> : null }

          </span>
          <br/>
          <br/>
          { usertype === "sender" ? senderSection : null}
          { usertype === "receiver" ? receiverSection : null }

          
        </section>
        <section>
          <h6>UPLOAD FILES</h6>    
          <p className='welcomecont'>Scrolldown for sending msgs section/debug section</p>      

          { connectionstate === "connected" ? filesection : completeconnectionfirst }
      
        </section>

        <section>
          <h6>SEND MESSAGES</h6>
          <p className='welcomecont'>Just type in the message and hit send, it should reach the other user if not check the debug console below this section</p>
          {sendSection}
        </section>

        <section>
          <h6>CONSOLE LOGS</h6>
          <p className='welcomecont'>Facing issues? Scroll the console area below for more information.</p>
          <div id="dbugconsole" style={{backgroundColor: '#111', color: '#bbb', borderRadius: '8px', padding: '10px', height: '300px', overflowY: 'scroll', fontFamily: 'monospace', maxWidth: '720px'}}>
            <p>~ This console is scrollable ^^</p>
          </div>
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
    this.lc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
      ]
    });
    this.dc = this.lc.createDataChannel("channel")
    this.dc.onmessage = e => this.log("Recieved: " + e.data)
    this.dc.onopen = e => this.log("Sender: connection open " + e.data)
    // log(this.lc.localDescription)
  }
  
  async create() {
    if (this.lc.localDescription) {
      this.log("Offer already created.");
      return JSON.stringify(this.lc.localDescription);
    }
    return new Promise(async (resolve) => {
      this.lc.onicecandidate = e => {
        if (e.candidate === null) {
          this.log("Final offer with ICE: " + JSON.stringify(this.lc.localDescription));
          resolve(JSON.stringify(this.lc.localDescription));  // bhai ice kaam nhi kr raha
        }
      };
      const offer = await this.lc.createOffer();
      await this.lc.setLocalDescription(offer);
    });
  }



  senddata(data) {
    if (this.dc && this.dc.readyState === "open") {
      this.dc.send(data);
      this.log("sent: " + data);
    } else {
      this.log("DataChannel not open yet! State: " + (this.dc?.readyState || 'null'));
    }
  }

  async answerofreceiver(answer=null) {
    
    if (answer){
      if ( JSON.parse(answer).type === this.lc.localDescription.type &&
           JSON.parse(answer).sdp === this.lc.localDescription.sdp ){
        this.log("!! Bro this is your own description, paste the one the receiver sent you damn it, read the guide dude")
        return 0
      }
      await this.lc.setRemoteDescription(JSON.parse(answer))
      this.log("new connection created finalized")
      return 1
      } return -1
    } 
  }

class weaveReceiver {
  constructor(log) {
    this.log = log;
    this.usertype = "receiver";
    this.rc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
      ]
    });

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
      this.log("DataChannel not open yet! State: " + (this.rc.dc?.readyState || 'null'));
    }
  }

  async offerbysender(offer = null) {
    if (offer) {
      await this.rc.setRemoteDescription(offer);
      const answer = await this.rc.createAnswer();
      await this.rc.setLocalDescription(answer);
      // this.log("Full answer SDP:", answer);

      return new Promise((resolve) => {
        this.rc.onicecandidate = e => {
          if (e.candidate === null) {
            this.log("Receiver: answer ready");
            resolve(this.rc.localDescription);
            this.log(JSON.stringify(this.rc.localDescription)); // kuch kaanm nhi kar raha yaar FFF
          }
        };
      });
    }
  }
}


const handlepaste = async () => {
  try {
    const text = await navigator.clipboard.readText();
    console.log("Pasted text: ", text);
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
