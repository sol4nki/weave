import React, { useRef, useEffect, useState } from 'react';

// import './App.css'
import Card from './components/Card'
import Filecard from './components/Filecard'
// import Header from './components/Header'
import Button, { Buttonwhite } from './components/Button'
import Footer from './components/Footer'
import './Demo.css'
import Notif from './components/Notif'

function Demo() {

  // sab kuch yahan hi dal raha cause no way i m working with global vars and states
  class weaveSender {
    constructor(log) {
      this.log = log;
      this.usertype = "sender";
      this.lc = new RTCPeerConnection({
        iceServers: [
          // STUN servers for local network discovery
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:3478" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:3478" },
          { urls: "stun:stun4.l.google.com:19302" },
          // TURN servers for cross-network connectivity
          { 
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject"
          },
          { 
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject", 
            credential: "openrelayproject"
          },
          { 
            urls: "turn:openrelay.metered.ca:443?transport=tcp",
            username: "openrelayproject",
            credential: "openrelayproject"
          }
        ],
        iceCandidatePoolSize: 10
      });

      this.dc = this.lc.createDataChannel("channel");
      this.chunks = [];
      this.receivedBuffers = [];

      this.dc.onmessage = async (event) => {
        if (typeof event.data === "string") {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "retransmit-request") {
              const chunk = this.chunks[msg.index];
              if (chunk) this.dc.send(chunk);
            } else if (msg.type === "file-chunk-meta") {
              this.pendingMeta = msg;
            } else if (msg.type === "file-end") {
              // done
            }
            this.log("Received: " + event.data);
          } catch {
            this.log("Received message: " + event.data);
          }
        } else if (this.pendingMeta) {
          const chunk = event.data;
          const hashBuffer = await crypto.subtle.digest("SHA-256", chunk);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

          if (hashHex === this.pendingMeta.hash) {
            this.receivedBuffers[this.pendingMeta.index] = chunk;
            this.pendingMeta = null;
          } else {
            // aagar hash mismatch hai toh retransmit req ez
            this.dc.send(
              JSON.stringify({
                type: "retransmit-request",
                index: this.pendingMeta.index,
              })
            );
            console.warn("Chunk", this.pendingMeta.index, "failed hash check");
          }
        }
      };

      this.dc.onopen = (e) => this.log("Sender: connection open " + e.data);
      this.incomingFile = null;
      this.lc.ondatachannel = (e) => {
        this.dc = e.channel;

        this.dc.onmessage = (event) => {
          if (typeof event.data === "string") {
            try {
              const msg = JSON.parse(event.data);
              if (msg.type === "file-meta") {
                this.incomingFile = { name: msg.name, size: msg.size, mime: msg.mime };
                this.receivedBuffers = [];
                this.log(`Receiving file: ${msg.name} (${msg.size} bytes)`);
              } else if (msg.type === "file-end") {
                const blob = new Blob(this.receivedBuffers, { type: this.incomingFile.mime });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = this.incomingFile.name;
                a.textContent = `Download ${this.incomingFile.name}`;
                document.getElementById("dbugconsole").appendChild(a);
                this.log(`File received: ${this.incomingFile.name}`);
                setReceivedFiles((prev) => [...prev, this.incomingFile]);
                this.receivedBuffers = [];
                this.incomingFile = null;
              } else {
                this.log("Received: " + event.data);
              }
            } catch {
              this.log("Received message: " + event.data);
            }
          } else {
            // Binary chunk
            this.receivedBuffers.push(event.data);
          }
        };

        this.dc.onopen = () => this.log("Receiver: connection open!");
      };
      // log(this.lc.localDescription)
    }

    async create() {
      if (this.lc.localDescription) {
        this.log("Offer already created.");
        return JSON.stringify(this.lc.localDescription);
      }
      return new Promise(async (resolve, reject) => {
        let iceGatheringComplete = false;
        let offerCreated = false;
        
        // Set up ICE gathering state monitoring
        this.lc.onicegatheringstatechange = () => {
          this.log(`ICE gathering state: ${this.lc.iceGatheringState}`);
          if (this.lc.iceGatheringState === 'complete' && offerCreated) {
            iceGatheringComplete = true;
            this.log("ICE gathering completed - final offer ready");
            resolve(JSON.stringify(this.lc.localDescription));
          }
        };

        // Set up ICE candidate handling
        this.lc.onicecandidate = (e) => {
          if (e.candidate) {
            this.log(`ICE candidate: ${e.candidate.candidate}`);
          } else {
            this.log("ICE candidate gathering finished");
            if (!iceGatheringComplete && offerCreated) {
              iceGatheringComplete = true;
              this.log("Final offer with ICE: " + JSON.stringify(this.lc.localDescription));
              resolve(JSON.stringify(this.lc.localDescription));
            }
          }
        };

        // Set up connection state monitoring
        this.lc.onconnectionstatechange = () => {
          this.log(`Connection state: ${this.lc.connectionState}`);
          if (this.lc.connectionState === 'failed') {
            this.log("Connection failed - check network connectivity");
          }
        };

        try {
          const offer = await this.lc.createOffer();
          await this.lc.setLocalDescription(offer);
          offerCreated = true;
          this.log("Offer created, gathering ICE candidates...");
          
          // Fallback timeout in case ICE gathering doesn't complete
          setTimeout(() => {
            if (!iceGatheringComplete) {
              this.log("ICE gathering timeout - using offer without complete ICE");
              resolve(JSON.stringify(this.lc.localDescription));
            }
          }, 10000); // 10 second timeout
          
        } catch (error) {
          this.log(`Error creating offer: ${error.message}`);
          reject(error);
        }
      });
    }

    senddata(data) {
      if (this.dc && this.dc.readyState === "open") {
        this.dc.send(data);
        this.log("sent: " + data);
      } else {
        this.log("DataChannel not open yet! State: " + (this.dc?.readyState || "null"));
      }
    }

    async answerofreceiver(answer = null) {
      if (answer) {
        try {
          const parsedAnswer = JSON.parse(answer);
          
          if (
            parsedAnswer.type === this.lc.localDescription.type &&
            parsedAnswer.sdp === this.lc.localDescription.sdp
          ) {
            this.log(
              "!! Bro this is your own description, paste the one the receiver sent you damn it, read the guide dude"
            );
            return 0;
          }
          
          await this.lc.setRemoteDescription(parsedAnswer);
          this.log("Remote description set successfully");
          
          // Monitor connection state
          this.lc.onconnectionstatechange = () => {
            this.log(`Connection state: ${this.lc.connectionState}`);
            if (this.lc.connectionState === 'connected') {
              this.log("Connection established successfully!");
            } else if (this.lc.connectionState === 'failed') {
              this.log("Connection failed - check network connectivity and firewall settings");
            }
          };

          // Monitor ICE connection state
          this.lc.oniceconnectionstatechange = () => {
            this.log(`ICE connection state: ${this.lc.iceConnectionState}`);
            if (this.lc.iceConnectionState === 'failed') {
              this.log("ICE connection failed - this usually means network connectivity issues");
            }
          };

          this.log("new connection created finalized");
          return 1;
        } catch (error) {
          this.log(`Error setting remote description: ${error.message}`);
          return -1;
        }
      }
      return -1;
    }

    sendFile(file) {
      const chunkSize = 16384; // 16 KB chunks (socha hai user can select chunk size but figure out if inc chunk size is better or file corrupt ho sakti hai)
      const reader = new FileReader();
      const dc = this.dc;
      const log = this.log;

      if (!dc || dc.readyState !== "open") {
        log("DataChannel not open yet! State: " + (dc?.readyState || "null"));
        return;
      }

      reader.onload = async (event) => {
        const buffer = event.target.result;
        log(`Sending file: ${file.name} (${buffer.byteLength} bytes)`);

        dc.send(
          JSON.stringify({
            type: "file-meta",
            name: file.name,
            size: buffer.byteLength,
            mime: file.type || "application/octet-stream",
          })
        );

        const totalChunks = Math.ceil(buffer.byteLength / chunkSize);
        this.chunks = new Array(totalChunks);

        for (let i = 0; i < totalChunks; i++) {
          const chunk = buffer.slice(i * chunkSize, (i + 1) * chunkSize);
          this.chunks[i] = chunk;
          const hashBuffer = await crypto.subtle.digest("SHA-256", chunk);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

          // bss metadata
          dc.send(
            JSON.stringify({
              type: "file-chunk-meta",
              index: i,
              hash: hashHex,
            })
          );

          dc.send(chunk);

          // dc.send(chunk); // yahan pe add karna hai hASH of the data
          await new Promise((r) => setTimeout(r, 10));
        }

        dc.send(JSON.stringify({ type: "file-end", name: file.name }));
        log(`File sent successfully: ${file.name}`);
        setSentFilesxyz((prev) => [...prev, file]);
        setTimeout(() => {
          setSendFiles((prev) => prev.filter((f) => f.name !== file.name));
        }, 500);
      };

      reader.readAsArrayBuffer(file.file);
    }
  }



  class weaveReceiver {
    constructor(log) {
      this.log = log;
      this.usertype = "receiver";
      this.rc = new RTCPeerConnection({
        iceServers: [
          // STUN servers for local network discovery
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:3478" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:3478" },
          { urls: "stun:stun4.l.google.com:19302" },
          // TURN servers for cross-network connectivity
          { 
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject"
          },
          { 
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject", 
            credential: "openrelayproject"
          },
          { 
            urls: "turn:openrelay.metered.ca:443?transport=tcp",
            username: "openrelayproject",
            credential: "openrelayproject"
          }
        ],
        iceCandidatePoolSize: 10
      });

      this.rc.onicecandidate = () => this.log("new icecandidate" + JSON.stringify(this.rc.localDescription));
      this.incomingFile = null;
      this.receivedBuffers = [];

      // receive wala logic (function ki zarurat nhi cause obviously open data channel pe aa raha hai toh process hojayega khud hi)
      this.rc.ondatachannel = e => {
        this.rc.dc = e.channel;

        this.rc.dc.onmessage = event => {
          if (typeof event.data === "string") {
            try {
              const msg = JSON.parse(event.data);
              if (msg.type === "file-meta") {
                this.incomingFile = { name: msg.name, size: msg.size, mime: msg.mime };
                this.receivedBuffers = [];
                this.log(`Receiving file: ${msg.name} (${msg.size} bytes)`);
              } else if (msg.type === "file-end") {
                const blob = new Blob(this.receivedBuffers, { type: this.incomingFile.mime });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = this.incomingFile.name;
                a.textContent = `Download ${this.incomingFile.name}`;
                document.getElementById("dbugconsole").appendChild(a);
                this.log(`File received: ${this.incomingFile.name}`);

                setReceivedFiles(prev => [...prev, this.incomingFile]);
                console.log(this.incomingFile);
                this.receivedBuffers = [];
                this.incomingFile = null;
              } else {
                this.log("Received: " + event.data);
              }
            } catch {
              this.log("Received message: " + event.data);
            }
          } else {
            // Binary chunk
            this.receivedBuffers.push(event.data);
          }
        };

        this.rc.dc.onopen = () => this.log("Receiver: connection open!");
      };
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
        const parsedOffer = typeof offer === "string" ? JSON.parse(offer) : offer;
        
        try {
          await this.rc.setRemoteDescription(new RTCSessionDescription(parsedOffer));
          this.log("Remote description set successfully");
          
          const answer = await this.rc.createAnswer();
          await this.rc.setLocalDescription(answer);
          this.log("Answer created, gathering ICE candidates...");

          return new Promise((resolve, reject) => {
            let iceGatheringComplete = false;
            
            
            this.rc.onicegatheringstatechange = () => {
              this.log(`ICE gathering state: ${this.rc.iceGatheringState}`);
              if (this.rc.iceGatheringState === 'complete') {
                iceGatheringComplete = true;
                this.log("ICE gathering completed - final answer ready");
                resolve(this.rc.localDescription);
              }
            };

            
            this.rc.onicecandidate = e => {
              if (e.candidate) {
                this.log(`ICE candidate: ${e.candidate.candidate}`);
              } else {
                this.log("ICE candidate gathering finished");
                if (!iceGatheringComplete) {
                  iceGatheringComplete = true;
                  this.log("Receiver: answer ready");
                  resolve(this.rc.localDescription);
                }
              }
            };

            
            this.rc.onconnectionstatechange = () => {
              this.log(`Connection state: ${this.rc.connectionState}`);
              if (this.rc.connectionState === 'failed') {
                this.log("Connection failed - check network connectivity");
              }
            };

            
            setTimeout(() => {
              if (!iceGatheringComplete) {
                this.log("ICE gathering timeout - using answer without complete ICE");
                resolve(this.rc.localDescription);
              }
            }, 10000); // 10 second timeout
            
          });
        } catch (error) {
          this.log(`Error processing offer: ${error.message}`);
          throw error;
        }
      }
    }
    // wahi open data channel wali baat wapis L
    sendFile(file) {
      const chunkSize = 16384; // 16 KB chunks (socha hai user can select chunk size but figure out if inc chunk size is better or file corrupt ho sakti hai)
      const reader = new FileReader();
      const dc = this.rc.dc;
      const log = this.log;

      if (!dc || dc.readyState !== "open") {
        log("DataChannel not open yet! State: " + (dc?.readyState || 'null'));
        return;
      }

      reader.onload = async (event) => {
        const buffer = event.target.result;
        log(`Sending file: ${file.name} (${buffer.byteLength} bytes)`);

        dc.send(JSON.stringify({
          type: "file-meta",
          name: file.name,
          size: buffer.byteLength,
          mime: file.type || "application/octet-stream"
        }));

        for (let offset = 0; offset < buffer.byteLength; offset += chunkSize) {
          const chunk = buffer.slice(offset, offset + chunkSize);
          dc.send(chunk);
          await new Promise(r => setTimeout(r, 10)); 
        }

        dc.send(JSON.stringify({ type: "file-end", name: file.name }));
        log(`File sent successfully: ${file.name}`);
        setSentFilesxyz(prev => [...prev, file.file]);
        setTimeout(() => {
          setSendFiles(prev => prev.filter(f => f.name !== file.name));
        }, 500);
      };
      

      reader.readAsArrayBuffer(file.file);
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
      return false;
    }
  };

  const handlecopy = async (text) => {
    console.log("copying...")
    try {
      await navigator.clipboard.writeText(text);
      console.log('Text copied to clipboard: ' + text);
      return true;
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert("Clipboard access failed. Make sure the website has permission to access clipboard. Copy the text manually from the console at the end of the page.");
      return false;
    }
  }
















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


  // file wala part yahan daal raha hu  filesxyz filexyz files (for easy search)

  const [sendFiles, setSendFiles] = useState([]);
  const [receivedFiles, setReceivedFiles] = useState([]);
  const [sentFilesxyz, setSentFilesxyz] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fileInput = fileInputRef.current;
    if (fileInput) {
      fileInput.addEventListener('change', handleFiles);
    }

    // cleanup to avoid memory leaks
    return () => {
      
      if (fileInput) {
        fileInput.removeEventListener('change', handleFiles);
      }
    };
  }, []);
  

  function handleFiles(event) {
    console.log("5")
    const files = event.target.files;
    console.log(files)
    if (files.length > 0) {
      const fileArray = [];
      for (let i = 0; i < files.length; i++) {

        console.log('File Name:', files[i].name);
        console.log('File Size:', files[i].size, 'bytes');
        console.log('File Type:', files[i].type);

        fileArray.push({
          file: files[i],
          name: files[i].name,
          size: files[i].size,
          type: 'sending',
          key: Math.random().toString(36).substring(2, 10) + i, // HAHAHA HAHAHA HAHAHA
        });
      }

      setSendFiles(prev => [...prev, ...fileArray]);
    }
  }





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
            const copied = await handlecopy(desc);
            if (!copied){
              setNotif(null);
              setTimeout(() => {
                setNotif({ title: "FAILED COPYING!", body: "Copy the text manually from the console at the end of the page." });
                }, 100);
              return;
            }
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
            const copied = await handlecopy(desc);
            if (!copied){
              setNotif(null);
              setTimeout(() => {
                setNotif({ title: "FAILED COPYING!", body: "Copy the text manually from the console at the end of the page." });
                }, 100);
              return;
            }
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
                console.log("here 1: " + step)
                
                console.log("here 2: " + step)
                setstep(2);
                setNotif(null);
                setstep(2);
                setconnectionstate("connected");
                setstep(2);
                setNotif(null);
                setTimeout(() => {
                  setNotif({ title: "Pasted successfully!", body: "Wait a few seconds for connection to finalize." });
                  setstep(2); // this works somehow i m too sleepy
                }, 100);
                setstep(2);
                setstep(2); // i fucking dont get it fuck it
                return;
                
              } else if (result === -1) {
                setNotif(null);
                setTimeout(() => {
                  setNotif({ title: "Clipboard Error", body: "The clipboard is empty or chunk is partial." });
                }, 100);
                return;

                
              }
            }} /> : (step === 2 ? <Buttonwhite text="Pasted Successfully!" /> : <Buttonwhite text="Complete Previous Step!" />)) : null}
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
            async () => {
            // const localdesc = new weaveSender(log).create();
            const senderoffer = await handlepaste();
            if (!senderoffer) {
              setNotif(null);
              setTimeout(() => {
                setNotif({ title: "Clipboard empty", body: "clipboard empty make sure the entire chunk is copied." });
                }, 100);
              return;
            }
            setstep(1);
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
              
              if (senderOffer){
                console.log("Received offer from clipboard:", senderOffer);
                const reply = await weaveclass.offerbysender(JSON.parse(senderOffer));
                
                const copied = await handlecopy(JSON.stringify(reply));
                if (!copied){
                  setNotif(null);
                  setTimeout(() => {
                    setNotif({ title: "FAILED COPYING!", body: "Copy the text manually from the console at the end of the page." });
                    }, 100);
                  return;
                }
                setstep(2);
                setconnectionstate("connected");
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
    // since both can send an receive ill just make it dono ke liye cause honestly 
    // only reason i kept it different is so that user can easily understand step number and stuff
    // easy peasy
    <> 
    <div className="sectioncardK">
      <h2 className="sectiontitleK">Share Files</h2>
      <p className="sectionsubK">Select files to upload and send them to the connected peer.</p>
      <label className="dropZone">
        <input
          type="file"
          multiple
          className="hiddenInput"
          id = "fileInput"
          ref={fileInputRef}
          onChange={handleFiles}
        />
        <div className="dropZoneContent">
          <p>Drag and Drop or Click to upload</p>
        </div>
      </label>

      <p style={{fontWeight: 'bold', minWidth: '100px'}}>Sending :</p>
      <div className="filebufferarray" id="sendingfiles">
        
        {sendFiles.length > 0 ? (
            sendFiles.map((file, index) => (
              <Filecard key={file.key} name={file.name} num={index+1} type={file.type} size={file.size}/>
            ))
          ) : (
            <p>No files uploaded yet.</p>
          )}
        <button style={{marginTop: '10px'}} onClick={() => {
          if (sendFiles.length > 0){
            for (let file of sendFiles) {
              weaveclass.sendFile(file);
              log(`Initiated sending for file: ${file.name}`);
            }
        }
        }}> Send Files </button>
        
      </div>
      <br/>
      <p style={{fontWeight: 'bold', minWidth: '100px'}}>Sent : </p>
      <div className="filebufferarray" id="sentfiles">
        {/* <Filecard name="file1.txt" num="0" type="done" /> */}
        {sentFilesxyz.length > 0 ? (
            sentFilesxyz.map((file, index) => (
              <Filecard key={file.name + Math.random().toString(36).substring(2, 10)} name={file.name} num={index+1} type={"done"} size={file.size}/>
            ))
          ) : (
            <p>No files sent yet.</p>
          )}
      </div>

    </div>
    <br/>
    <div className="sectioncardK">
      <h2 className="sectiontitleK">Received Files</h2>
      <p className="sectionsubK">Click on the file received to download</p>
      <p style={{fontWeight: 'bold', minWidth: '100px'}}>Received : </p>
      <div className="filebufferarray" id="receivedfiles">
        {/* <Filecard name="file1.txt" num="0" type="done" /> */}
        {receivedFiles.length > 0 ? (
            receivedFiles?.map((file, index) => {
              if (!file) return null;
              return <Filecard key={file.name + Math.random().toString(36).substring(2, 10)} name={file.name} num={index+1} type={"received"} size={file.size}/>;
            })
          ) : (
            <p>No files received yet.</p>
          )}
        
      </div>
    </div>
    </>
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
          {/* {filesection} */}
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









// this is very bad code, i should do better
// 1. everything is just dumped into one file
// 2. proper state management hai hi nhi
// 3. structure nhi hai kuch bhi i made classes but still doesnt feel right
// 4. error handling ke naam pe notifs hi hai bss F (ux wise bhi not the best)
// 5. scalable nhi hai bilkul bhi but if this project does well ill fix them and recode the entire logic 
// cause rn i know kya struct follow karna hai after trial and error for hours so it can be done better
// 7. koi useful comment nhi hai ismein yaar F baadmein padhne mein dikkat hogi but function names dhang se hai
// 8. ui is alright tho hahahaha :P

export default Demo




