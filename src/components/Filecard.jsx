import './Filecard.css';

export default function Filecard({num="1", name="file_name", type="upload", size=0, blobUrl=null, onClick=null}) {
  
  const handleClick = () => {
    if (type === "received" && blobUrl) {
      // Create a temporary link and trigger download
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (onClick) {
      onClick();
    }
  };
  
  return (
    <>
      <div 
        className={`filecontainer ${type === "received" ? "clickable" : ""}`}
        onClick={handleClick}
        style={{ cursor: type === "received" ? "pointer" : "default" }}
      >
        <div className="cardnum">{num.toString().padStart(2, '0')}</div>
        <h5>{name}</h5> 
        <span style={{fontSize: "12px", color: "#666", marginRight: "8px"}}>
          {
          size >= 1024 * 1024
            ? `${(size / (1024 * 1024)).toFixed(2)}Mb`
            : (size < 1024) ? `${size}bytes` : `${(size / 1024).toFixed(2)}Kb`
          }
        </span>
        {/* <p>{type}</p> */}
        {type === "upload" ? <h4>↑</h4> : null}
        {type === "received" ? <h4>↓</h4> : null}
        {type === "done" ? <h4>✓</h4> : null}

    </div>
    </>
  )
}
