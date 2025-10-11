import './Filecard.css';

export default function Filecard({num="1", name="file_name", type="upload"}) {
  
  return (
    <>
      <div className="filecontainer">
        <div className="cardnum">{num.padStart(2, '0')}</div>
        <h5>{name}</h5>
        {/* <p>{type}</p> */}
        {type === "upload" ? <h4>↑</h4> : null}
        {type === "received" ? <h4>↓</h4> : null}
        {type === "done" ? <h4>✓</h4> : null}
        
    </div>
    </>
  )
}
