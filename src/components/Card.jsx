import './Card.css';

export default function Card({number="01", heading="heading", description="descp lorem ipsum something xyz weave."}) {
  
  return (
    <>
      <div className="cardx">
        <div className="cardnum">{number}</div>
        <h3>{heading}</h3>
        <p>{description}</p>
    </div>
    </>
  )
}
