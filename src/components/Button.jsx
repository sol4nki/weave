import './Button.css'

export default function Button({text="Click", onClick=()=>{console.log("Button clicked")}}) {
  return (
    <>
        <button className="button" onClick={onClick}>
          {text}
        </button>

    </>
  )
}

export function Buttonwhite({text="Click", onClick=()=>{console.log("Button clicked")}}) {
  return (
    <>
        <button className="buttonwhite" onClick={onClick}>
          {text}
        </button>
    </>
  )
}
