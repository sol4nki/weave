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
      this.iceServers = [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:3478" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:3478" },
        { urls: "stun:stun4.l.google.com:19302" },
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
        },
        { 
          urls: "turn:relay.metered.ca:80",
          username: "87e4c4b4b2b4b4b4",
          credential: "87e4c4b4b2b4b4b4"
        },
        { 
          urls: "turn:relay.metered.ca:443",
          username: "87e4c4b4b2b4b4b4",
          credential: "87e4c4b4b2b4b4b4"
        }
      ];
      
      this.currentIceServerIndex = 0;
      this.retryCount = 0;
      this.maxRetries = 3;
      
      this.lc = new RTCPeerConnection({
        iceServers: this.iceServers,
        iceCandidatePoolSize: 10
      });

      this.dc = this.lc.createDataChannel("channel");
      this.chunks = [];
      this.receivedBuffers = [];
      
      // Track states to prevent log spam
      this.lastIceGatheringState = null;
      this.lastConnectionState = null;
      this.lastIceConnectionState = null;

      this.dc.onmessage = async (event) => {
        if (typeof event.data === "string") {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "retransmit-request") {
              const chunk = this.chunks[msg.index];
              if (chunk) this.dc.send(chunk);
            } else if (msg.type === "file-meta") {
              this.incomingFile = { name: msg.name, size: parseInt(msg.size), mime: msg.mime };
              this.receivedBuffers = [];
              this.log(`Receiving file: ${msg.name} (${msg.size} bytes)`);
              console.log("File metadata received:", this.incomingFile);
            } else if (msg.type === "file-chunk-meta") {
              this.pendingMeta = msg;
            } else if (msg.type === "file-end") {
              const blob = new Blob(this.receivedBuffers, { type: this.incomingFile.mime });
              const url = URL.createObjectURL(blob);
              this.log(`File received: ${this.incomingFile.name}`);
              console.log("Adding file to receivedFiles:", { ...this.incomingFile, blobUrl: url });
              console.log("Blob size:", blob.size);
              console.log("Received buffers length:", this.receivedBuffers.length);
              console.log("Original file size from metadata:", this.incomingFile.size);
              // Use the actual blob size instead of metadata size for display
              const fileData = { ...this.incomingFile, blobUrl: url, size: blob.size };
              setReceivedFiles((prev) => [...prev, fileData]);
              this.receivedBuffers = [];
              this.incomingFile = null;
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
        } else {
          // Binary chunk - add to received buffers
          this.receivedBuffers.push(event.data);
        }
      };

      this.dc.onopen = (e) => {
        this.log("Sender: connection open " + e.data);
        setConnectionStatus("connected");
        setIsConnecting(false);
      };
      this.incomingFile = null;
      this.fileQueue = []; // Queue for handling multiple files
      this.lc.ondatachannel = (e) => {
        this.dc = e.channel;
        this.dc.onopen = () => {
          this.log("Receiver: connection open!");
          setConnectionStatus("connected");
          setIsConnecting(false);
        };
      };
      // log(this.lc.localDescription)
    }

    async create() {
      if (this.lc.localDescription) {
        this.log("Offer already created.");
        return JSON.stringify(this.lc.localDescription);
      }
      
      setIsGenerating(true);
      setIsConnecting(true);
      setConnectionStatus("connecting");
      
      return new Promise(async (resolve, reject) => {
        let iceGatheringComplete = false;
        let offerCreated = false;
        
        this.lc.onicegatheringstatechange = () => {
          if (this.lastIceGatheringState !== this.lc.iceGatheringState) {
            this.log(`ICE gathering state: ${this.lc.iceGatheringState}`);
            this.lastIceGatheringState = this.lc.iceGatheringState;
          }
          if (this.lc.iceGatheringState === 'complete' && offerCreated) {
            iceGatheringComplete = true;
            this.log("ICE gathering completed - final offer ready");
            setIsGenerating(false);
            resolve(JSON.stringify(this.lc.localDescription));
          }
        };

        this.lc.onicecandidate = (e) => {
          if (e.candidate) {
            this.log(`ICE candidate: ${e.candidate.candidate}`);
          } else {
            this.log("ICE candidate gathering finished");
            if (!iceGatheringComplete && offerCreated) {
              iceGatheringComplete = true;
              this.log("Final offer with ICE: " + JSON.stringify(this.lc.localDescription));
              setIsGenerating(false);
              resolve(JSON.stringify(this.lc.localDescription));
            }
          }
        };

        this.lc.onconnectionstatechange = () => {
          if (this.lastConnectionState !== this.lc.connectionState) {
            this.log(`Connection state: ${this.lc.connectionState}`);
            this.lastConnectionState = this.lc.connectionState;
            setConnectionStatus(this.lc.connectionState);
          }
          if (this.lc.connectionState === 'failed') {
            this.log("Connection failed - attempting retry...");
            this.handleConnectionFailure();
          }
        };

        try {
          const offer = await this.lc.createOffer();
          await this.lc.setLocalDescription(offer);
          offerCreated = true;
          this.log("Offer created, gathering ICE candidates...");
          
          setTimeout(() => {
            if (!iceGatheringComplete) {
              this.log("ICE gathering timeout - using offer without complete ICE");
              setIsGenerating(false);
              resolve(JSON.stringify(this.lc.localDescription));
            }
          }, 10000);
          
        } catch (error) {
          this.log(`Error creating offer: ${error.message}`);
          setIsGenerating(false);
          setIsConnecting(false);
          setConnectionStatus("failed");
          reject(error);
        }
      });
    }
    
    handleConnectionFailure() {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        this.log(`Retrying connection (attempt ${this.retryCount}/${this.maxRetries})...`);
        
        setTimeout(() => {
          this.currentIceServerIndex = (this.currentIceServerIndex + 1) % this.iceServers.length;
          this.lc = new RTCPeerConnection({
            iceServers: [this.iceServers[this.currentIceServerIndex]],
            iceCandidatePoolSize: 10
          });
          this.setupConnectionHandlers();
        }, 2000);
      } else {
        this.log("Max retries reached. Connection failed.");
        setIsConnecting(false);
        setConnectionStatus("failed");
      }
    }
    
    setupConnectionHandlers() {
      this.dc = this.lc.createDataChannel("channel");
      this.dc.onopen = (e) => {
        this.log("Sender: connection open " + e.data);
        setConnectionStatus("connected");
        setIsConnecting(false);
      };
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
            if (this.lastConnectionState !== this.lc.connectionState) {
              this.log(`Connection state: ${this.lc.connectionState}`);
              this.lastConnectionState = this.lc.connectionState;
            }
            if (this.lc.connectionState === 'connected') {
              this.log("Connection established successfully!");
            } else if (this.lc.connectionState === 'failed') {
              this.log("Connection failed - check network connectivity and firewall settings");
            }
          };

          // Monitor ICE connection state
          this.lc.oniceconnectionstatechange = () => {
            if (this.lastIceConnectionState !== this.lc.iceConnectionState) {
              this.log(`ICE connection state: ${this.lc.iceConnectionState}`);
              this.lastIceConnectionState = this.lc.iceConnectionState;
            }
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
      return new Promise((resolve, reject) => {
        const chunkSize = 16384; // 16 KB chunks (socha hai user can select chunk size but figure out if inc chunk size is better or file corrupt ho sakti hai)
        const reader = new FileReader();
        const dc = this.dc;
        const log = this.log;

        if (!dc || dc.readyState !== "open") {
          log("DataChannel not open yet! State: " + (dc?.readyState || "null"));
          reject(new Error("DataChannel not open"));
          return;
        }

        reader.onload = async (event) => {
        const buffer = event.target.result;
        const fileId = file.name + Date.now();
        const startTime = Date.now();
        let bytesSent = 0;
        
        log(`Sending file: ${file.name} (${buffer.byteLength} bytes)`);

        dc.send(
          JSON.stringify({
            type: "file-meta",
            name: file.name,
            size: buffer.byteLength,
            mime: file.file.type || "application/octet-stream",
          })
        );

        const totalChunks = Math.ceil(buffer.byteLength / chunkSize);
        this.chunks = new Array(totalChunks);

        setTransferProgress(prev => ({
          ...prev,
          [fileId]: { current: 0, total: totalChunks, fileName: file.name }
        }));

        for (let i = 0; i < totalChunks; i++) {
          const chunk = buffer.slice(i * chunkSize, (i + 1) * chunkSize);
          this.chunks[i] = chunk;
          const hashBuffer = await crypto.subtle.digest("SHA-256", chunk);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

          dc.send(
            JSON.stringify({
              type: "file-chunk-meta",
              index: i,
              hash: hashHex,
            })
          );

          dc.send(chunk);
          bytesSent += chunk.byteLength;
          
          const elapsed = (Date.now() - startTime) / 1000;
          const speed = bytesSent / elapsed;
          
          setTransferProgress(prev => ({
            ...prev,
            [fileId]: { current: i + 1, total: totalChunks, fileName: file.name }
          }));
          
          setTransferSpeed(prev => ({
            ...prev,
            [fileId]: { speed: speed, bytesSent: bytesSent, totalBytes: buffer.byteLength }
          }));

          await new Promise((r) => setTimeout(r, 10));
        }

        dc.send(JSON.stringify({ type: "file-end", name: file.name }));
        log(`File sent successfully: ${file.name}`);
        setSentFilesxyz((prev) => [...prev, file]);
        setTimeout(() => {
          setSendFiles((prev) => prev.filter((f) => f.key !== file.key));
          setTransferProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
          });
          setTransferSpeed(prev => {
            const newSpeed = { ...prev };
            delete newSpeed[fileId];
            return newSpeed;
          });
          resolve(); // Resolve the promise when file is completely sent
        }, 500);
      };

      reader.readAsArrayBuffer(file.file);
      });
    }
  }



  class weaveReceiver {
    constructor(log) {
      this.log = log;
      this.usertype = "receiver";
      this.iceServers = [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:3478" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:3478" },
        { urls: "stun:stun4.l.google.com:19302" },
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
        },
        { 
          urls: "turn:relay.metered.ca:80",
          username: "87e4c4b4b2b4b4b4",
          credential: "87e4c4b4b2b4b4b4"
        },
        { 
          urls: "turn:relay.metered.ca:443",
          username: "87e4c4b4b2b4b4b4",
          credential: "87e4c4b4b2b4b4b4"
        }
      ];
      
      this.currentIceServerIndex = 0;
      this.retryCount = 0;
      this.maxRetries = 3;
      
      this.rc = new RTCPeerConnection({
        iceServers: this.iceServers,
        iceCandidatePoolSize: 10
      });

      // Track states to prevent log spam
      this.lastIceGatheringState = null;
      this.lastConnectionState = null;
      this.lastIceConnectionState = null;
      
      this.rc.onicecandidate = (e) => {
        if (e.candidate) {
          this.log(`New ICE candidate: ${e.candidate.candidate}`);
        }
      };
      this.incomingFile = null;
      this.receivedBuffers = [];
      this.fileQueue = []; // Queue for handling multiple files
      this.chunks = [];
      this.pendingMeta = null;

      // receive wala logic (function ki zarurat nhi cause obviously open data channel pe aa raha hai toh process hojayega khud hi)
      this.rc.ondatachannel = e => {
        this.rc.dc = e.channel;

        this.rc.dc.onmessage = async (event) => {
          if (typeof event.data === "string") {
            try {
              const msg = JSON.parse(event.data);
              if (msg.type === "retransmit-request") {
                const chunk = this.chunks[msg.index];
                if (chunk) this.rc.dc.send(chunk);
              } else if (msg.type === "file-meta") {
                this.incomingFile = { name: msg.name, size: parseInt(msg.size), mime: msg.mime };
                this.receivedBuffers = [];
                this.log(`Receiving file: ${msg.name} (${msg.size} bytes)`);
                console.log("File metadata received:", this.incomingFile);
              } else if (msg.type === "file-chunk-meta") {
                this.pendingMeta = msg;
              } else if (msg.type === "file-end") {
                const blob = new Blob(this.receivedBuffers, { type: this.incomingFile.mime });
                const url = URL.createObjectURL(blob);
                this.log(`File received: ${this.incomingFile.name}`);
                console.log("Adding file to receivedFiles:", { ...this.incomingFile, blobUrl: url });
                console.log("Blob size:", blob.size);
                console.log("Received buffers length:", this.receivedBuffers.length);
                console.log("Original file size from metadata:", this.incomingFile.size);
                // Use the actual blob size instead of metadata size for display
                const fileData = { ...this.incomingFile, blobUrl: url, size: blob.size };
                setReceivedFiles((prev) => [...prev, fileData]);
                this.receivedBuffers = [];
                this.incomingFile = null;
              } else {
                this.log("Received: " + event.data);
              }
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
              this.rc.dc.send(
                JSON.stringify({
                  type: "retransmit-request",
                  index: this.pendingMeta.index,
                })
              );
              console.warn("Chunk", this.pendingMeta.index, "failed hash check");
            }
          } else {
            // Binary chunk - add to received buffers
            this.receivedBuffers.push(event.data);
          }
        };

        this.rc.dc.onopen = () => {
          this.log("Receiver: connection open!");
          setConnectionStatus("connected");
          setIsConnecting(false);
        };
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
        
        setIsGenerating(true);
        setIsConnecting(true);
        setConnectionStatus("connecting");
        
        try {
          await this.rc.setRemoteDescription(new RTCSessionDescription(parsedOffer));
          this.log("Remote description set successfully");
          
          const answer = await this.rc.createAnswer();
          await this.rc.setLocalDescription(answer);
          this.log("Answer created, gathering ICE candidates...");

          return new Promise((resolve, reject) => {
            let iceGatheringComplete = false;
            
            this.rc.onicegatheringstatechange = () => {
              if (this.lastIceGatheringState !== this.rc.iceGatheringState) {
                this.log(`ICE gathering state: ${this.rc.iceGatheringState}`);
                this.lastIceGatheringState = this.rc.iceGatheringState;
              }
              if (this.rc.iceGatheringState === 'complete') {
                iceGatheringComplete = true;
                this.log("ICE gathering completed - final answer ready");
                setIsGenerating(false);
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
                  setIsGenerating(false);
                  resolve(this.rc.localDescription);
                }
              }
            };

            this.rc.onconnectionstatechange = () => {
              if (this.lastConnectionState !== this.rc.connectionState) {
                this.log(`Connection state: ${this.rc.connectionState}`);
                this.lastConnectionState = this.rc.connectionState;
                setConnectionStatus(this.rc.connectionState);
              }
              if (this.rc.connectionState === 'failed') {
                this.log("Connection failed - attempting retry...");
                this.handleConnectionFailure();
              }
            };

            setTimeout(() => {
              if (!iceGatheringComplete) {
                this.log("ICE gathering timeout - using answer without complete ICE");
                setIsGenerating(false);
                resolve(this.rc.localDescription);
              }
            }, 10000);
            
          });
        } catch (error) {
          this.log(`Error processing offer: ${error.message}`);
          setIsGenerating(false);
          setIsConnecting(false);
          setConnectionStatus("failed");
          throw error;
        }
      }
    }
    
    handleConnectionFailure() {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        this.log(`Retrying connection (attempt ${this.retryCount}/${this.maxRetries})...`);
        
        setTimeout(() => {
          this.currentIceServerIndex = (this.currentIceServerIndex + 1) % this.iceServers.length;
          this.rc = new RTCPeerConnection({
            iceServers: [this.iceServers[this.currentIceServerIndex]],
            iceCandidatePoolSize: 10
          });
          this.setupConnectionHandlers();
        }, 2000);
      } else {
        this.log("Max retries reached. Connection failed.");
        setIsConnecting(false);
        setConnectionStatus("failed");
      }
    }
    
    setupConnectionHandlers() {
      this.rc.ondatachannel = e => {
        this.rc.dc = e.channel;
        this.rc.dc.onopen = () => {
          this.log("Receiver: connection open!");
          setConnectionStatus("connected");
          setIsConnecting(false);
        };
      };
    }
    // wahi open data channel wali baat wapis L
    sendFile(file) {
      return new Promise((resolve, reject) => {
        const chunkSize = 16384;
        const reader = new FileReader();
        const dc = this.rc.dc;
        const log = this.log;

        if (!dc || dc.readyState !== "open") {
          log("DataChannel not open yet! State: " + (dc?.readyState || 'null'));
          reject(new Error("DataChannel not open"));
          return;
        }

        reader.onload = async (event) => {
        const buffer = event.target.result;
        const fileId = file.name + Date.now();
        const startTime = Date.now();
        let bytesSent = 0;
        
        log(`Sending file: ${file.name} (${buffer.byteLength} bytes)`);

        dc.send(JSON.stringify({
          type: "file-meta",
          name: file.name,
          size: buffer.byteLength,
          mime: file.file.type || "application/octet-stream"
        }));

        const totalChunks = Math.ceil(buffer.byteLength / chunkSize);
        this.chunks = new Array(totalChunks);

        setTransferProgress(prev => ({
          ...prev,
          [fileId]: { current: 0, total: totalChunks, fileName: file.name }
        }));

        for (let i = 0; i < totalChunks; i++) {
          const chunk = buffer.slice(i * chunkSize, (i + 1) * chunkSize);
          this.chunks[i] = chunk;
          const hashBuffer = await crypto.subtle.digest("SHA-256", chunk);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

          dc.send(
            JSON.stringify({
              type: "file-chunk-meta",
              index: i,
              hash: hashHex,
            })
          );

          dc.send(chunk);
          bytesSent += chunk.byteLength;
          
          const elapsed = (Date.now() - startTime) / 1000;
          const speed = bytesSent / elapsed;
          
          setTransferProgress(prev => ({
            ...prev,
            [fileId]: { current: i + 1, total: totalChunks, fileName: file.name }
          }));
          
          setTransferSpeed(prev => ({
            ...prev,
            [fileId]: { speed: speed, bytesSent: bytesSent, totalBytes: buffer.byteLength }
          }));

          await new Promise(r => setTimeout(r, 10));
        }

        dc.send(JSON.stringify({ type: "file-end", name: file.name }));
        log(`File sent successfully: ${file.name}`);
        setSentFilesxyz(prev => [...prev, file]);
        setTimeout(() => {
          setSendFiles(prev => prev.filter(f => f.key !== file.key));
          setTransferProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
          });
          setTransferSpeed(prev => {
            const newSpeed = { ...prev };
            delete newSpeed[fileId];
            return newSpeed;
          });
          resolve(); // Resolve the promise when file is completely sent
        }, 500);
      };

      reader.readAsArrayBuffer(file.file);
      });
    }



  }

  const handlepaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      console.log("Pasted text: ", text);
      return text;
    } catch (err) {
      console.error("Failed to read clipboard contents:", err);
      console.log("Showing manual paste modal");
      return new Promise((resolve) => {
        console.log("Setting paste resolver");
        pasteResolverRef.current = resolve;
        setShowManualPaste(true);
      });
    }
  };
  
  const handleManualPasteComplete = (text) => {
    console.log("Manual paste completed with text:", text);
    setShowManualPaste(false);
    setPasteText("");
    if (pasteResolverRef.current) {
      console.log("Resolving promise with text:", text);
      pasteResolverRef.current(text);
      pasteResolverRef.current = null;
    } else {
      console.log("No paste resolver found!");
    }
  };
  
  const handleManualPasteCancel = () => {
    setShowManualPaste(false);
    setPasteText("");
    if (pasteResolverRef.current) {
      pasteResolverRef.current("");
      pasteResolverRef.current = null;
    }
  };

  const handlecopy = async (text) => {
    console.log("copying...")
    try {
      if (document.hasFocus && !document.hasFocus()) {
        window.focus();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      await navigator.clipboard.writeText(text);
      console.log('Text copied to clipboard: ' + text);
      return true;
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setGeneratedText(text);
      setShowManualCopy(true);
      return false;
    }
  }
















  const [connectionstate, setconnectionstate] = useState("disconnected");
  const [usertype, setusertype] = useState(null);
  const [step, setstep] = useState(0);
  const [senderOffer, setSenderOffer] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [transferProgress, setTransferProgress] = useState({});
  const [transferSpeed, setTransferSpeed] = useState({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showManualCopy, setShowManualCopy] = useState(false);
  const [showManualPaste, setShowManualPaste] = useState(false);
  const [generatedText, setGeneratedText] = useState("");
  const [pasteText, setPasteText] = useState("");
  const pasteResolverRef = useRef(null); // zaruri hai stoprage ke for global scope
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
    // Clear the input so the same files can be selected again
    event.target.value = '';
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
            setstep(1); // Always update step regardless of clipboard success
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
              
              if (!data || data.trim() === "") {
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
                setstep(2);
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
            console.log("Receiver: Starting paste process");
            const senderoffer = await handlepaste();
            console.log("Receiver: Got paste result:", senderoffer);
            console.log("Receiver: Paste result type:", typeof senderoffer);
            console.log("Receiver: Paste result length:", senderoffer ? senderoffer.length : "null");
            
            if (!senderoffer || senderoffer.trim() === "") {
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
          {usertype === "sender" ? (step === 1 ? <Button text="Click to paste" onClick={async () => {
            const data = await handlepaste();
            if (data && data.trim() !== "") {
              setstep(2);
            }
          }} /> : (step === 0 ? <Buttonwhite text="Complete Previous Step!" /> : <Buttonwhite text="Pasted Successfully!" />)) : null}
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
            /> : (step === 0 ? <Buttonwhite text="Complete Previous Step!" /> : <Buttonwhite text="Copied Successfully!" />)) : null}
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
          // multiple so multiple isnt working cause file sending is asynch but on reading metadata its synchronus and leads to conflict in meta data hence the last file's data is only printed without any meta data FF 
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
        <button className="sendfilebutton" onClick={async () => {
          if (sendFiles.length > 0){
            for (let file of sendFiles) {
              try {
                log(`Starting to send file: ${file.name}`);
                await weaveclass.sendFile(file);
                log(`Completed sending file: ${file.name}`);
                // Add a shorter delay between files to ensure proper sequencing
                await new Promise(resolve => setTimeout(resolve, 500));
              } catch (error) {
                log(`Error sending file ${file.name}: ${error.message}`);
              }
            }
        }
        }}> Send Files </button>
        
      </div>
      
      {Object.keys(transferProgress).length > 0 && (
        <div style={{marginTop: '20px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '8px'}}>
          <h4 style={{margin: '0 0 10px 0'}}>Transfer Progress</h4>
          {Object.entries(transferProgress).map(([fileId, progress]) => (
            <div key={fileId} style={{marginBottom: '10px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
                <span style={{fontSize: '14px', fontWeight: 'bold'}}>{progress.fileName}</span>
                <span style={{fontSize: '12px'}}>{progress.current}/{progress.total} chunks</span>
              </div>
              <div style={{width: '100%', height: '8px', backgroundColor: '#e0e0e0', borderRadius: '4px', overflow: 'hidden'}}>
                <div style={{
                  width: `${(progress.current / progress.total) * 100}%`,
                  height: '100%',
                  backgroundColor: '#4CAF50',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
              {transferSpeed[fileId] && (
                <div style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
                  Speed: {(transferSpeed[fileId].speed / 1024 / 1024).toFixed(2)} MB/s | 
                  Progress: {((transferSpeed[fileId].bytesSent / transferSpeed[fileId].totalBytes) * 100).toFixed(1)}%
                </div>
              )}
            </div>
          ))}
        </div>
      )}
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
              console.log("Rendering received file:", file);
              return <Filecard key={file.name + Math.random().toString(36).substring(2, 10)} name={file.name} num={index+1} type={"received"} size={file.size} blobUrl={file.blobUrl}/>;
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
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
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
          
          {usertype && (
            <div style={{marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '8px', maxWidth: '720px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <div style={{
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '50%', 
                  backgroundColor: connectionStatus === 'connected' ? '#4CAF50' : 
                                 connectionStatus === 'connecting' ? '#FF9800' : 
                                 connectionStatus === 'failed' ? '#F44336' : '#9E9E9E'
                }}></div>
                <span>Connection: {connectionStatus}</span>
                {isConnecting && <span style={{fontSize: '12px'}}>↺ Connecting...</span>}
                {isGenerating && <span style={{fontSize: '12px'}}>⛭ Generating...</span>}
              </div>
            </div>
          )}
          
          {isGenerating && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '10px',
                textAlign: 'center',
                maxWidth: '300px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid #f3f3f3',
                  borderTop: '4px solid #3498db',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 20px'
                }}></div>
                <h3 style={{margin: '0 0 10px 0'}}>Generating Connection</h3>
                <p style={{margin: '0', color: '#666'}}>Please wait while we establish the connection...</p>
              </div>
            </div>
          )}
          
          {showManualCopy && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '10px',
                maxWidth: '600px',
                maxHeight: '80vh',
                overflow: 'auto'
              }}>
                <h3 style={{margin: '0 0 15px 0'}}>Manual Copy Required</h3>
                <p style={{margin: '0 0 15px 0', color: '#666'}}>
                  Clipboard access was denied. Please select and copy the text below manually:
                </p>
                <textarea 
                  value={generatedText}
                  readOnly
                  style={{
                    width: '100%',
                    height: '200px',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    resize: 'vertical'
                  }}
                  onClick={(e) => e.target.select()}
                />
                <div style={{marginTop: '15px', display: 'flex', gap: '10px'}}>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(generatedText).then(() => {
                        setShowManualCopy(false);
                        setGeneratedText("");
                      });
                    }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    Try Copy Again
                  </button>
                  <button 
                    onClick={() => {
                      setShowManualCopy(false);
                      setGeneratedText("");
                    }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {showManualPaste && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '10px',
                maxWidth: '600px',
                maxHeight: '80vh',
                overflow: 'auto'
              }}>
                <h3 style={{margin: '0 0 15px 0'}}>Manual Paste Required</h3>
                <p style={{margin: '0 0 15px 0', color: '#666'}}>
                  Clipboard access was denied. Please paste the text manually in the field below:
                </p>
                <textarea 
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Paste the connection text here..."
                  style={{
                    width: '100%',
                    height: '200px',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    resize: 'vertical'
                  }}
                />
                <div style={{marginTop: '15px', display: 'flex', gap: '10px'}}>
                  <button 
                    onClick={() => {
                      if (pasteText.trim()) {
                        handleManualPasteComplete(pasteText.trim());
                      }
                    }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    Use This Text
                  </button>
                  <button 
                    onClick={handleManualPasteCancel}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          
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




