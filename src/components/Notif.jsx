import './Notif.css'

export default function Notif({text="Click", onClick=()=>{console.log("Notif clicked")}}) {
  return (
    <>
        <div className="notif" onClick={onClick}>
            {text}
        </div>

    </>
  )
}
